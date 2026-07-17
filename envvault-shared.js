/**
 * Shared EnvVault client — fetch, decrypt, cache in a process-wide global.
 * Zero npm dependencies — copy this file with envvault-bootstrap.js.
 *
 * Secrets live in memory only. Use getKey("NAME") instead of process.env.NAME.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_BASE_URL = "https://env.classyendeavors.com";
const CONFIG_FILE = ".envvault.json";
const DECRYPTION_KEY_PREFIX = "wdk_";
const GLOBAL_KEY = "__ENVVAULT_INSTANCE__";

function globalStore() {
  return globalThis;
}

function readJsonConfig(cwd) {
  const configPath = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse ${CONFIG_FILE}: ${error.message}`);
  }
}

function loadConfig(cwd) {
  const fileConfig = readJsonConfig(cwd);

  const decryptionKey =
    process.env.ENVVAULT_DECRYPTION_KEY || fileConfig.decryptionKey;
  const fileLink = process.env.ENVVAULT_FILE_LINK || fileConfig.fileLink;
  const baseUrl = (
    process.env.ENVVAULT_BASE_URL ||
    fileConfig.baseUrl ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");

  if (!decryptionKey) {
    throw new Error(
      `Missing decryption key. Set ENVVAULT_DECRYPTION_KEY in your shell or add decryptionKey to ${CONFIG_FILE}`,
    );
  }

  if (!fileLink) {
    throw new Error(
      `Missing file link. Set ENVVAULT_FILE_LINK or add fileLink to ${CONFIG_FILE}`,
    );
  }

  return { decryptionKey, fileLink, baseUrl };
}

function decryptionKeyToBuffer(rawKey) {
  const stripped = rawKey.startsWith(DECRYPTION_KEY_PREFIX)
    ? rawKey.slice(DECRYPTION_KEY_PREFIX.length)
    : rawKey;
  const buf = Buffer.from(stripped, "base64url");
  if (buf.length !== 32) {
    throw new Error("Invalid workspace decryption key length");
  }
  return buf;
}

function decryptWithWorkspaceKey(payload, decryptionKey) {
  const key = decryptionKeyToBuffer(decryptionKey);
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function parseValuesJson(json) {
  const parsed = JSON.parse(json);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Values must be a JSON object");
  }
  return parsed;
}

class Vault {
  constructor(config) {
    this.decryptionKey = config.decryptionKey;
    this.fileLink = config.fileLink;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.values = {};
    this.initialized = false;
    this.name = null;
    this.updatedAt = null;

    globalStore()[GLOBAL_KEY] = this;
  }

  async init() {
    const url = `${this.baseUrl}/api/v1/vault/${encodeURIComponent(this.fileLink)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.decryptionKey}` },
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || `HTTP ${response.status} ${response.statusText}`);
    }

    const json = decryptWithWorkspaceKey(body.encrypted, this.decryptionKey);
    this.values = parseValuesJson(json);
    this.name = body.name ?? null;
    this.updatedAt = body.updatedAt ?? null;
    this.initialized = true;
    return this;
  }

  getKey(name) {
    this.assertReady();
    return this.values[name];
  }

  requireKey(name) {
    const value = this.getKey(name);
    if (value === undefined) {
      throw new Error(`EnvVault: missing required key "${name}"`);
    }
    return value;
  }

  getAll() {
    this.assertReady();
    return { ...this.values };
  }

  async refresh() {
    this.initialized = false;
    return this.init();
  }

  assertReady() {
    if (!this.initialized) {
      throw new Error("Vault not initialized. Call await initEnvVault() / loadEnvFromVault() first.");
    }
  }
}

function vault() {
  const instance = globalStore()[GLOBAL_KEY];
  if (!instance) {
    throw new Error(
      "EnvVault not initialized. Call await initEnvVault(...) or loadEnvFromVault() first.",
    );
  }
  return instance;
}

function getKey(name) {
  return vault().getKey(name);
}

function requireKey(name) {
  return vault().requireKey(name);
}

/**
 * Create the global vault and load secrets into memory.
 * Call once in your server entrypoint.
 */
async function initEnvVault(config) {
  const instance = new Vault(config);
  await instance.init();
  return instance;
}

async function fetchEnvFromVault(config) {
  const instance = new Vault(config);
  await instance.init();
  const parsed = instance.getAll();

  return {
    fileLink: config.fileLink,
    name: instance.name,
    updatedAt: instance.updatedAt,
    parsed,
    values: parsed,
  };
}

/**
 * Fetches env from EnvVault and stores values in the global in-memory vault.
 * Does not write to process.env or a .env file.
 */
async function loadEnvFromVault(cwd = process.cwd()) {
  const config = loadConfig(cwd);
  const instance = await initEnvVault(config);
  const parsed = instance.getAll();

  return {
    fileLink: config.fileLink,
    name: instance.name,
    updatedAt: instance.updatedAt,
    parsed,
    values: parsed,
    keysLoaded: Object.keys(parsed).length,
  };
}

module.exports = {
  CONFIG_FILE,
  DEFAULT_BASE_URL,
  Vault,
  loadConfig,
  fetchEnvFromVault,
  decryptWithWorkspaceKey,
  initEnvVault,
  loadEnvFromVault,
  vault,
  getKey,
  requireKey,
};

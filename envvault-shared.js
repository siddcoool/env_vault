/**
 * Shared EnvVault client utilities for load/run scripts.
 * Zero npm dependencies — copy this file with load-script.js / envvault-bootstrap.js.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_BASE_URL = "https://env.classyendeavors.com";
const CONFIG_FILE = ".envvault.json";
const DECRYPTION_KEY_PREFIX = "wdk_";

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

  const apiKey = process.env.ENVVAULT_API_KEY || fileConfig.apiKey;
  const decryptionKey =
    process.env.ENVVAULT_DECRYPTION_KEY || fileConfig.decryptionKey;
  const fileLink = process.env.ENVVAULT_FILE_LINK || fileConfig.fileLink;
  const baseUrl = (
    process.env.ENVVAULT_BASE_URL ||
    fileConfig.baseUrl ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");

  if (!apiKey) {
    throw new Error(
      `Missing API key. Set ENVVAULT_API_KEY in your shell or add apiKey to ${CONFIG_FILE}`,
    );
  }

  if (!decryptionKey) {
    throw new Error(
      `Missing decryption key. Set ENVVAULT_DECRYPTION_KEY or add decryptionKey to ${CONFIG_FILE}`,
    );
  }

  if (!fileLink) {
    throw new Error(
      `Missing file link. Set ENVVAULT_FILE_LINK or add fileLink to ${CONFIG_FILE}`,
    );
  }

  return { apiKey, decryptionKey, fileLink, baseUrl };
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
    this.apiKey = config.apiKey;
    this.decryptionKey = config.decryptionKey;
    this.fileLink = config.fileLink;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
    this.values = {};
    this.initialized = false;
  }

  async init() {
    const url = `${this.baseUrl}/api/v1/vault/${encodeURIComponent(this.fileLink)}`;
    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.apiKey}` },
    });
    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(body.error || `HTTP ${response.status} ${response.statusText}`);
    }

    const json = decryptWithWorkspaceKey(body.encrypted, this.decryptionKey);
    this.values = parseValuesJson(json);
    this.initialized = true;
  }

  getKey(name) {
    if (!this.initialized) {
      throw new Error("Vault not initialized. Call await vault.init() first.");
    }
    return this.values[name];
  }

  getAll() {
    if (!this.initialized) {
      throw new Error("Vault not initialized. Call await vault.init() first.");
    }
    return { ...this.values };
  }
}

async function fetchEnvFromVault(config) {
  const vault = new Vault(config);
  await vault.init();
  const parsed = vault.getAll();

  return {
    fileLink: config.fileLink,
    parsed,
    values: parsed,
  };
}

function applyEnvToProcess(parsed, { overwrite = true } = {}) {
  let count = 0;

  for (const [key, value] of Object.entries(parsed)) {
    if (!overwrite && key in process.env) continue;
    process.env[key] = value;
    count += 1;
  }

  process.env.ENVVAULT_LOADED = "1";
  return count;
}

/**
 * Fetches env from EnvVault and injects values into process.env (runtime only).
 */
async function loadEnvFromVault(cwd = process.cwd(), options = {}) {
  const config = loadConfig(cwd);
  const result = await fetchEnvFromVault(config);
  const count = applyEnvToProcess(result.parsed, options);

  return {
    ...result,
    keysLoaded: count,
  };
}

module.exports = {
  CONFIG_FILE,
  DEFAULT_BASE_URL,
  Vault,
  loadConfig,
  fetchEnvFromVault,
  decryptWithWorkspaceKey,
  applyEnvToProcess,
  loadEnvFromVault,
};

/**
 * Shared EnvVault client utilities for load/run scripts.
 * Zero npm dependencies — copy this file with load-script.js / envvault-bootstrap.js.
 */

const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const DEFAULT_BASE_URL = "https://env.classyendeavors.com";
const CONFIG_FILE = ".envvault.json";

const RSA_PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;
const RSA_HASH = "sha256";

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

function resolvePrivateKey(cwd, fileConfig) {
  if (process.env.ENVVAULT_PRIVATE_KEY) {
    return process.env.ENVVAULT_PRIVATE_KEY;
  }

  const keyPath = path.resolve(
    cwd,
    process.env.ENVVAULT_PRIVATE_KEY_PATH ||
      fileConfig.privateKeyPath ||
      "private.pem",
  );

  if (!fs.existsSync(keyPath)) {
    throw new Error(
      `Private key not found at ${keyPath}. Set ENVVAULT_PRIVATE_KEY, ENVVAULT_PRIVATE_KEY_PATH, or privateKeyPath in ${CONFIG_FILE}`,
    );
  }

  return fs.readFileSync(keyPath, "utf8");
}

function loadConfig(cwd) {
  const fileConfig = readJsonConfig(cwd);
  const folderName = path.basename(path.resolve(cwd));

  const apiKey = process.env.ENVVAULT_API_KEY || fileConfig.apiKey;
  const baseUrl = (
    process.env.ENVVAULT_BASE_URL ||
    fileConfig.baseUrl ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");
  const project =
    process.env.ENVVAULT_PROJECT || fileConfig.project || folderName;
  const file =
    process.env.ENVVAULT_FILE ||
    fileConfig.loadFile ||
    (Array.isArray(fileConfig.files) ? fileConfig.files[0] : undefined) ||
    ".env";

  if (!apiKey) {
    throw new Error(
      `Missing API key. Set ENVVAULT_API_KEY in your shell or add apiKey to ${CONFIG_FILE}`,
    );
  }

  const privateKey = resolvePrivateKey(cwd, fileConfig);

  return { apiKey, baseUrl, project, file, privateKey };
}

function decryptWithPrivateKey(payload, privateKeyPem) {
  const aesKey = crypto.privateDecrypt(
    { key: privateKeyPem, padding: RSA_PADDING, oaepHash: RSA_HASH },
    Buffer.from(payload.encryptedKey, "base64"),
  );

  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", aesKey, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ]);

  return decrypted.toString("utf8");
}

function parseEnvContent(content) {
  const result = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

async function fetchEnvFromVault(config) {
  const url = new URL(`${config.baseUrl}/api/v1/env`);
  url.searchParams.set("project", config.project);
  url.searchParams.set("file", config.file);

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
    },
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      body.error || `HTTP ${response.status} ${response.statusText}`,
    );
  }

  const content = decryptWithPrivateKey(body.encrypted, config.privateKey);

  return {
    project: body.project,
    file: body.file,
    updatedAt: body.updatedAt ?? null,
    content,
    parsed: parseEnvContent(content),
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
 * Does not write any .env file to disk.
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
  loadConfig,
  fetchEnvFromVault,
  parseEnvContent,
  decryptWithPrivateKey,
  applyEnvToProcess,
  loadEnvFromVault,
};

/**
 * EnvVault — single-file drop-in client (no npm package required).
 *
 * Copy this file into your server (e.g. `src/env-vault.ts`), call
 * `initEnvVault(...)` once in your entrypoint (`main.ts` / `index.ts`), then use
 * `getKey("MY_SECRET")` anywhere instead of `process.env.MY_SECRET`.
 *
 * Values are fetched from your EnvVault server, decrypted locally with your
 * workspace decryption key, and cached in a single global instance.
 *
 * Requires Node.js 18+ (built-in `fetch`). No external dependencies.
 */
import crypto from "crypto";

const DECRYPTION_KEY_PREFIX = "wdk_";
const GLOBAL_KEY = "__ENVVAULT_INSTANCE__";

type GlobalWithVault = typeof globalThis & {
  [GLOBAL_KEY]?: EnvVault;
};

function globalStore(): GlobalWithVault {
  return globalThis as GlobalWithVault;
}

export interface EnvVaultConfig {
  /** Workspace decryption key (`wdk_...`) — used for API auth and local decryption. */
  decryptionKey: string;
  /** Unique file link (`vl_...`) copied from the EnvVault dashboard. */
  fileLink: string;
  /** EnvVault server URL, e.g. `https://envvault.example.com`. */
  baseUrl: string;
}

interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

interface VaultApiResponse {
  fileLink: string;
  name: string;
  updatedAt: string | null;
  encrypted: EncryptedPayload;
}

function decryptionKeyToBuffer(rawKey: string): Buffer {
  const stripped = rawKey.startsWith(DECRYPTION_KEY_PREFIX)
    ? rawKey.slice(DECRYPTION_KEY_PREFIX.length)
    : rawKey;

  const buffer = Buffer.from(stripped, "base64url");
  if (buffer.length !== 32) {
    throw new Error("Invalid workspace decryption key length");
  }
  return buffer;
}

function decryptPayload(payload: EncryptedPayload, decryptionKey: string): string {
  const key = decryptionKeyToBuffer(decryptionKey);
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}

function parseValuesJson(json: string): Record<string, string> {
  const parsed = JSON.parse(json) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Vault values must be a JSON object");
  }

  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string") {
      throw new Error(`Value for "${key}" must be a string`);
    }
    result[key] = value;
  }
  return result;
}

export class EnvVault {
  private readonly decryptionKey: string;
  private readonly fileLink: string;
  private readonly baseUrl: string;
  private values: Record<string, string> = {};
  private initialized = false;

  constructor(config: EnvVaultConfig) {
    if (!config.decryptionKey) throw new Error("EnvVault: `decryptionKey` is required");
    if (!config.fileLink) throw new Error("EnvVault: `fileLink` is required");
    if (!config.baseUrl) throw new Error("EnvVault: `baseUrl` is required");

    this.decryptionKey = config.decryptionKey;
    this.fileLink = config.fileLink;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");

    // Register this instance as the process-wide singleton on construction.
    globalStore()[GLOBAL_KEY] = this;
  }

  /** Fetch and decrypt env values from the vault. */
  async init(): Promise<this> {
    const url = `${this.baseUrl}/api/v1/vault/${encodeURIComponent(this.fileLink)}`;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${this.decryptionKey}` },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(
        body.error ?? `EnvVault API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as VaultApiResponse;
    const json = decryptPayload(data.encrypted, this.decryptionKey);
    this.values = parseValuesJson(json);
    this.initialized = true;
    return this;
  }

  /** Get a single env value by key — use instead of `process.env.X`. */
  getKey(name: string): string | undefined {
    this.assertReady();
    return this.values[name];
  }

  /** Get a value, throwing if it is missing. */
  requireKey(name: string): string {
    const value = this.getKey(name);
    if (value === undefined) {
      throw new Error(`EnvVault: missing required key "${name}"`);
    }
    return value;
  }

  /** Get all decrypted values. */
  getAll(): Record<string, string> {
    this.assertReady();
    return { ...this.values };
  }

  /** Re-fetch values from the server. */
  async refresh(): Promise<this> {
    this.initialized = false;
    return this.init();
  }

  private assertReady(): void {
    if (!this.initialized) {
      throw new Error("EnvVault not initialized. Call `await initEnvVault(...)` first.");
    }
  }
}

/**
 * Create the global EnvVault instance and load secrets.
 * Call this once in your server entrypoint (`main.ts` / `index.ts`).
 */
export async function initEnvVault(config: EnvVaultConfig): Promise<EnvVault> {
  const vault = new EnvVault(config);
  await vault.init();
  return vault;
}

/** Access the global EnvVault instance. Throws if `initEnvVault` was not called. */
export function vault(): EnvVault {
  const instance = globalStore()[GLOBAL_KEY];
  if (!instance) {
    throw new Error(
      "EnvVault not initialized. Call `await initEnvVault(...)` in your server entrypoint.",
    );
  }
  return instance;
}

/** Shortcut for `vault().getKey(name)` — drop-in replacement for `process.env.X`. */
export function getKey(name: string): string | undefined {
  return vault().getKey(name);
}

/** Shortcut for `vault().requireKey(name)`. */
export function requireKey(name: string): string {
  return vault().requireKey(name);
}

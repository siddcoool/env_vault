import crypto from "crypto";

let cachedKey: Buffer | null = null;

/**
 * Resolves the 32-byte AES-256 key from ENCRYPTION_KEY.
 *
 * Accepted formats (checked in order, first 32-byte match wins):
 *  1. 64 lower-case hex characters  (e.g. output of `openssl rand -hex 32`)
 *  2. 43-44 base64 / base64url characters (e.g. output of `openssl rand -base64 32`)
 *
 * Any other length or format throws immediately so misconfiguration is caught
 * at startup rather than silently producing wrong cipher keys.
 */
function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // 1. Try hex (64 chars → 32 bytes).
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    cachedKey = Buffer.from(rawKey, "hex");
    return cachedKey;
  }

  // 2. Try base64 / base64url (strips padding, then decodes).
  const b64Normalized = rawKey.replace(/-/g, "+").replace(/_/g, "/");
  const b64Buf = Buffer.from(b64Normalized, "base64");
  if (b64Buf.length === 32) {
    cachedKey = b64Buf;
    return cachedKey;
  }

  throw new Error(
    `ENCRYPTION_KEY must be a 64-character hex string or a 32-byte base64 string. ` +
      `Got ${rawKey.length} characters which decoded to ${b64Buf.length} bytes. ` +
      `Generate a valid key with: openssl rand -hex 32`,
  );
}

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

export function encrypt(text: string): EncryptedPayload {
  const iv = crypto.randomBytes(12); // 96-bit IV for AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
}

export function decrypt(payload: EncryptedPayload): string {
  return decryptWithKey(payload, getKey());
}

export function encryptWithKey(text: string, key: Buffer): EncryptedPayload {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const authTag = cipher.getAuthTag();

  return {
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
}

export function decryptWithKey(payload: EncryptedPayload, key: Buffer): string {
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}



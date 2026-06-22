import crypto from "crypto";

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

const DECRYPTION_KEY_PREFIX = "wdk_";

function decryptionKeyToBuffer(rawKey: string): Buffer {
  const stripped = rawKey.startsWith(DECRYPTION_KEY_PREFIX)
    ? rawKey.slice(DECRYPTION_KEY_PREFIX.length)
    : rawKey;

  const buf = Buffer.from(stripped, "base64url");
  if (buf.length !== 32) {
    throw new Error("Invalid workspace decryption key length");
  }
  return buf;
}

export function decryptWithWorkspaceKey(
  payload: EncryptedPayload,
  decryptionKey: string,
): string {
  const key = decryptionKeyToBuffer(decryptionKey);
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}

export function parseValuesJson(json: string): Record<string, string> {
  const parsed = JSON.parse(json) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Values must be a JSON object");
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

import crypto from "crypto";

const DECRYPTION_KEY_PREFIX = "wdk_";
const FILE_LINK_PREFIX = "vl_";

export function generateDecryptionKey(): string {
  const random = crypto.randomBytes(32).toString("base64url");
  return `${DECRYPTION_KEY_PREFIX}${random}`;
}

export function hashDecryptionKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export function getDecryptionKeyPrefix(key: string): string {
  return key.slice(0, 12);
}

export function generateFileLink(): string {
  const random = crypto.randomBytes(16).toString("base64url");
  return `${FILE_LINK_PREFIX}${random}`;
}

export function decryptionKeyToBuffer(rawKey: string): Buffer {
  const stripped = rawKey.startsWith(DECRYPTION_KEY_PREFIX)
    ? rawKey.slice(DECRYPTION_KEY_PREFIX.length)
    : rawKey;

  const buf = Buffer.from(stripped, "base64url");
  if (buf.length !== 32) {
    throw new Error("Invalid workspace decryption key length");
  }
  return buf;
}

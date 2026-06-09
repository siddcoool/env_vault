import crypto from "crypto";

let cachedKey: Buffer | null = null;

// Expect a 32-byte key (256-bit) provided as hex or base64.
function getKey(): Buffer {
  if (cachedKey) return cachedKey;

  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) {
    throw new Error("ENCRYPTION_KEY environment variable is not set");
  }

  // Try base64 then hex; fall back to utf8 (for simple dev keys).
  try {
    const buf = Buffer.from(rawKey, "base64");
    if (buf.length === 32) {
      cachedKey = buf;
      return buf;
    }
  } catch {
    // ignore
  }

  try {
    const buf = Buffer.from(rawKey, "hex");
    if (buf.length === 32) {
      cachedKey = buf;
      return buf;
    }
  } catch {
    // ignore
  }

  const utf8 = Buffer.from(rawKey, "utf8");
  if (utf8.length >= 32) {
    cachedKey = utf8.subarray(0, 32);
    return cachedKey;
  }

  // Pad to 32 bytes for short dev keys.
  const padded = Buffer.alloc(32);
  utf8.copy(padded);
  cachedKey = padded;
  return padded;
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
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");

  const decipher = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}



import crypto from "crypto";

const RAW_KEY = process.env.ENCRYPTION_KEY;

if (!RAW_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is not set");
}

// Expect a 32-byte key (256-bit) provided as hex or base64.
function getKey(): Buffer {
  if (!RAW_KEY) throw new Error("ENCRYPTION_KEY environment variable is not set");

  // Try base64 then hex; fall back to utf8 (for simple dev keys).
  try {
    const buf = Buffer.from(RAW_KEY, "base64");
    if (buf.length === 32) return buf;
  } catch {
    // ignore
  }

  try {
    const buf = Buffer.from(RAW_KEY, "hex");
    if (buf.length === 32) return buf;
  } catch {
    // ignore
  }

  const utf8 = Buffer.from(RAW_KEY, "utf8");
  if (utf8.length >= 32) {
    return utf8.subarray(0, 32);
  }

  // Pad to 32 bytes for short dev keys.
  const padded = Buffer.alloc(32);
  utf8.copy(padded);
  return padded;
}

const KEY = getKey();

export interface EncryptedPayload {
  iv: string;
  authTag: string;
  ciphertext: string;
}

export function encrypt(text: string): EncryptedPayload {
  const iv = crypto.randomBytes(12); // 96-bit IV for AES-256-GCM
  const cipher = crypto.createCipheriv("aes-256-gcm", KEY, iv);
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

  const decipher = crypto.createDecipheriv("aes-256-gcm", KEY, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

  return decrypted.toString("utf8");
}



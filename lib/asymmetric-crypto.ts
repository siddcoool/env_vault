import crypto from "crypto";

/** Hybrid RSA-OAEP + AES-256-GCM payload for client-side decryption. */
export interface HybridEncryptedPayload {
  encryptedKey: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

const RSA_PADDING = crypto.constants.RSA_PKCS1_OAEP_PADDING;
const RSA_HASH = "sha256";

export function encryptWithPublicKey(
  plaintext: string,
  publicKeyPem: string,
): HybridEncryptedPayload {
  const aesKey = crypto.randomBytes(32);
  const iv = crypto.randomBytes(12);

  const cipher = crypto.createCipheriv("aes-256-gcm", aesKey, iv);
  const encrypted = Buffer.concat([
    cipher.update(plaintext, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();

  const encryptedKey = crypto.publicEncrypt(
    { key: publicKeyPem, padding: RSA_PADDING, oaepHash: RSA_HASH },
    aesKey,
  );

  return {
    encryptedKey: encryptedKey.toString("base64"),
    iv: iv.toString("base64"),
    authTag: authTag.toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
}

export function decryptWithPrivateKey(
  payload: HybridEncryptedPayload,
  privateKeyPem: string,
): string {
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

export function validatePublicKeyPem(publicKeyPem: string): boolean {
  try {
    crypto.createPublicKey(publicKeyPem);
    return true;
  } catch {
    return false;
  }
}

export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const { publicKey, privateKey } = crypto.generateKeyPairSync("rsa", {
    modulusLength: 2048,
    publicKeyEncoding: { type: "spki", format: "pem" },
    privateKeyEncoding: { type: "pkcs8", format: "pem" },
  });
  return { publicKey, privateKey };
}

/**
 * Migrate legacy EnvVault data to workspace-based architecture.
 *
 * Usage:
 *   MIGRATION_ADMIN_EMAIL=admin@example.com \
 *   MIGRATION_ADMIN_PASSWORD=yourpassword \
 *   node scripts/migrate-to-workspaces.js
 *
 * Requires MONGODB_URI, MONGODB_DB, ENCRYPTION_KEY in environment.
 */

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

const MONGODB_URI = process.env.MONGODB_URI;
const MONGODB_DB = process.env.MONGODB_DB || "envvault";
const ADMIN_EMAIL = process.env.MIGRATION_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.MIGRATION_ADMIN_PASSWORD;

if (!MONGODB_URI || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    "Set MONGODB_URI, MIGRATION_ADMIN_EMAIL, and MIGRATION_ADMIN_PASSWORD",
  );
  process.exit(1);
}

function getServerKey() {
  const rawKey = process.env.ENCRYPTION_KEY;
  if (!rawKey) throw new Error("ENCRYPTION_KEY is required");

  try {
    const buf = Buffer.from(rawKey, "base64");
    if (buf.length === 32) return buf;
  } catch {
    /* ignore */
  }

  try {
    const buf = Buffer.from(rawKey, "hex");
    if (buf.length === 32) return buf;
  } catch {
    /* ignore */
  }

  const utf8 = Buffer.from(rawKey, "utf8");
  const padded = Buffer.alloc(32);
  utf8.copy(padded);
  return padded;
}

function encrypt(text) {
  const key = getServerKey();
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

function decrypt(payload) {
  const key = getServerKey();
  const iv = Buffer.from(payload.iv, "base64");
  const authTag = Buffer.from(payload.authTag, "base64");
  const ciphertext = Buffer.from(payload.ciphertext, "base64");
  const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
  decipher.setAuthTag(authTag);
  return Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
}

function encryptWithKey(text, keyBuf) {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", keyBuf, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return {
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
    ciphertext: encrypted.toString("base64"),
  };
}

function parseEnvToObject(content) {
  const result = {};
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;
    const k = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    result[k] = value;
  }
  return result;
}

function generateDecryptionKey() {
  return `wdk_${crypto.randomBytes(32).toString("base64url")}`;
}

function generateFileLink() {
  return `vl_${crypto.randomBytes(16).toString("base64url")}`;
}

function hashDecryptionKey(key) {
  return crypto.createHash("sha256").update(key).digest("hex");
}

function decryptionKeyToBuffer(rawKey) {
  const stripped = rawKey.startsWith("wdk_") ? rawKey.slice(4) : rawKey;
  return Buffer.from(stripped, "base64url");
}

async function main() {
  await mongoose.connect(MONGODB_URI, { dbName: MONGODB_DB });
  const db = mongoose.connection.db;

  const users = db.collection("users");
  const workspaces = db.collection("workspaces");
  const projects = db.collection("projects");
  const apiKeys = db.collection("api_keys");

  const existingUser = await users.findOne({ email: ADMIN_EMAIL.toLowerCase() });
  if (existingUser) {
    console.log("Migration already run (admin user exists). Skipping.");
    await mongoose.disconnect();
    return;
  }

  const decryptionKey = generateDecryptionKey();
  const keyBuf = decryptionKeyToBuffer(decryptionKey);
  const now = new Date().toISOString();

  const workspaceResult = await workspaces.insertOne({
    name: "Default Workspace",
    decryptionKeyHash: hashDecryptionKey(decryptionKey),
    decryptionKeyEnc: encrypt(decryptionKey),
    decryptionKeyPrefix: decryptionKey.slice(0, 12),
    createdAt: now,
  });

  const workspaceId = workspaceResult.insertedId;

  console.log("Created workspace:", workspaceId.toString());
  console.log("IMPORTANT — save this decryption key:", decryptionKey);

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);
  await users.insertOne({
    email: ADMIN_EMAIL.toLowerCase(),
    passwordHash,
    name: "Admin",
    workspaceId,
    createdAt: now,
  });

  console.log("Created admin user:", ADMIN_EMAIL);

  const legacyProjects = await projects.find({ workspaceId: { $exists: false } }).toArray();

  for (const project of legacyProjects) {
    const envFiles = (project.envFiles || []).map((file) => {
      const fileLink = file.fileLink || generateFileLink();
      let valuesEnc = file.valuesEnc;
      let valuesEncClient = file.valuesEncClient;

      if (!valuesEnc) {
        let plaintext = file.content || "";
        if (file.contentEnc) {
          try {
            plaintext = decrypt(file.contentEnc);
          } catch {
            /* keep empty */
          }
        }
        const json = JSON.stringify(parseEnvToObject(plaintext));
        valuesEnc = encrypt(json);
        valuesEncClient = encryptWithKey(json, keyBuf);
      }

      return {
        ...file,
        fileLink,
        valuesEnc,
        valuesEncClient,
      };
    });

    await projects.updateOne(
      { _id: project._id },
      { $set: { workspaceId, envFiles } },
    );
  }

  console.log(`Migrated ${legacyProjects.length} projects`);

  const legacyKeys = await apiKeys.find({ workspaceId: { $exists: false } }).toArray();
  for (const key of legacyKeys) {
    await apiKeys.updateOne(
      { _id: key._id },
      {
        $set: { workspaceId },
        $unset: { publicKeyPem: "", privateKeyEnc: "" },
      },
    );
  }

  console.log(`Migrated ${legacyKeys.length} API keys`);

  await db.collection("passcodes").deleteMany({});

  console.log("Migration complete.");
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

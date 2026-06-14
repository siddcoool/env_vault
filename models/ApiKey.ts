import { Schema, model, models } from "mongoose";

const EncryptedPayloadSchema = new Schema(
  {
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    ciphertext: { type: String, required: true },
  },
  { _id: false },
);

const ApiKeySchema = new Schema(
  {
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    publicKeyPem: { type: String, required: true },
    privateKeyEnc: { type: EncryptedPayloadSchema, required: true },
    createdAt: { type: String, required: true },
  },
  { collection: "api_keys" },
);

export const ApiKeyModel = models.ApiKey || model("ApiKey", ApiKeySchema);

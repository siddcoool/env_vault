import { Schema, model, models } from "mongoose";

const ApiKeySchema = new Schema(
  {
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    publicKeyPem: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { collection: "api_keys" },
);

export const ApiKeyModel = models.ApiKey || model("ApiKey", ApiKeySchema);

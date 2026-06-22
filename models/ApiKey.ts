import { Schema, model, models, Types } from "mongoose";

const ApiKeySchema = new Schema(
  {
    workspaceId: { type: Types.ObjectId, required: true, ref: "Workspace", index: true },
    name: { type: String, required: true },
    keyHash: { type: String, required: true, unique: true },
    keyPrefix: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { collection: "api_keys" },
);

export const ApiKeyModel = models.ApiKey || model("ApiKey", ApiKeySchema);

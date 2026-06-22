import { Schema, model, models } from "mongoose";
import type { EncryptedPayload } from "../lib/crypto";

const EncryptedPayloadSchema = new Schema<EncryptedPayload>(
  {
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    ciphertext: { type: String, required: true },
  },
  { _id: false },
);

const WorkspaceSchema = new Schema(
  {
    name: { type: String, required: true },
    decryptionKeyHash: { type: String, required: true },
    decryptionKeyEnc: { type: EncryptedPayloadSchema, required: true },
    decryptionKeyPrefix: { type: String, required: true },
    createdAt: { type: String, required: true },
  },
  { collection: "workspaces" },
);

export const WorkspaceModel =
  models.Workspace || model("Workspace", WorkspaceSchema);

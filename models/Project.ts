import { Schema, model, models, Types } from "mongoose";
import type { EncryptedPayload } from "../lib/crypto";

const EncryptedPayloadSchema = new Schema<EncryptedPayload>(
  {
    iv: { type: String, required: true },
    authTag: { type: String, required: true },
    ciphertext: { type: String, required: true },
  },
  { _id: false },
);

const EnvFileSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    fileLink: { type: String, required: true },
    content: { type: String },
    contentEnc: { type: EncryptedPayloadSchema, required: false },
    valuesEnc: { type: EncryptedPayloadSchema, required: false },
    valuesEncClient: { type: EncryptedPayloadSchema, required: false },
    updatedAt: { type: String, required: false },
  },
  { _id: false },
);

const ProjectSchema = new Schema(
  {
    workspaceId: { type: Types.ObjectId, required: true, ref: "Workspace", index: true },
    name: { type: String, required: true },
    description: { type: String },
    createdAt: { type: String },
    envFiles: { type: [EnvFileSchema], default: [] },
  },
  {
    collection: "projects",
  },
);

ProjectSchema.index({ workspaceId: 1, name: 1 });
ProjectSchema.index({ "envFiles.fileLink": 1 });

export const ProjectModel =
  models.Project || model("Project", ProjectSchema);

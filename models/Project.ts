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

const EnvFileSchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    content: { type: String }, // legacy/plain support
    contentEnc: { type: EncryptedPayloadSchema, required: false },
    updatedAt: { type: String, required: false },
  },
  { _id: false },
);

const ProjectSchema = new Schema(
  {
    name: { type: String, required: true },
    description: { type: String },
    createdAt: { type: String },
    envFiles: { type: [EnvFileSchema], default: [] },
  },
  {
    collection: "projects",
  },
);

export const ProjectModel =
  models.Project || model("Project", ProjectSchema);



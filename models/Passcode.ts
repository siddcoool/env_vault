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

const PasscodeSchema = new Schema(
  {
    valueEnc: { type: EncryptedPayloadSchema, required: true },
    createdAt: { type: String, required: false },
    updatedAt: { type: String, required: false },
  },
  { collection: "passcodes" },
);

export const PasscodeModel = models.Passcode || model("Passcode", PasscodeSchema);

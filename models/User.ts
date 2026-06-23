import { Schema, model, models, Types } from "mongoose";

const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    name: { type: String, trim: true },
    workspaceId: { type: Types.ObjectId, required: true, ref: "Workspace", index: true },
    createdAt: { type: String, required: true },
  },
  { collection: "users" },
);

export const UserModel = models.User || model("User", UserSchema);

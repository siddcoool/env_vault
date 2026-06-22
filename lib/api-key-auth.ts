import { Types } from "mongoose";
import { connectDb } from "./mongoose";
import { ApiKeyModel } from "../models/ApiKey";
import { hashApiKey } from "./api-key-utils";

export interface AuthenticatedApiKey {
  id: string;
  name: string;
  workspaceId: string;
}

export async function authenticateApiKey(
  apiKey: string,
): Promise<AuthenticatedApiKey | null> {
  if (!apiKey.startsWith("evk_")) return null;

  await connectDb();

  const keyHash = hashApiKey(apiKey);
  const doc = await ApiKeyModel.findOne({ keyHash }).lean<{
    _id: unknown;
    name: string;
    workspaceId: Types.ObjectId;
  }>();

  if (!doc) return null;

  return {
    id: String(doc._id),
    name: doc.name,
    workspaceId: doc.workspaceId.toString(),
  };
}

"use server";

import { Types } from "mongoose";
import { revalidatePath } from "next/cache";
import { connectDb } from "../lib/mongoose";
import { ApiKeyModel } from "../models/ApiKey";
import {
  generateApiKey,
  hashApiKey,
  getApiKeyPrefix,
} from "../lib/api-key-utils";
import { requireUser } from "../lib/auth";
import type { ApiKey } from "../types";

export async function getApiKeysFromDb(): Promise<ApiKey[]> {
  const user = await requireUser();
  await connectDb();

  const docs = await ApiKeyModel.find({ workspaceId: user.workspaceId })
    .sort({ createdAt: -1 })
    .lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    keyPrefix: doc.keyPrefix,
    createdAt: doc.createdAt,
  }));
}

export async function createApiKeyAction(
  formData: FormData,
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    return { success: false, error: "Name is required" };
  }

  await connectDb();

  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);

  await ApiKeyModel.create({
    workspaceId: new Types.ObjectId(user.workspaceId),
    name,
    keyHash,
    keyPrefix: getApiKeyPrefix(apiKey),
    createdAt: new Date().toISOString(),
  });

  revalidatePath("/");
  return { success: true, apiKey };
}

export async function deleteApiKeyAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await connectDb();
  await ApiKeyModel.findOneAndDelete({
    _id: new Types.ObjectId(id),
    workspaceId: new Types.ObjectId(user.workspaceId),
  });
  revalidatePath("/");
}

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
import { validatePublicKeyPem } from "../lib/asymmetric-crypto";
import { reencryptAllEnvFilesForApiKey, removeApiKeyEncryptions } from "../lib/env-reencrypt";
import type { ApiKey } from "../types";

export async function getApiKeysFromDb(): Promise<ApiKey[]> {
  await connectDb();

  const docs = await ApiKeyModel.find({}).sort({ createdAt: -1 }).lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    keyPrefix: doc.keyPrefix,
    publicKeyPem: doc.publicKeyPem,
    createdAt: doc.createdAt,
  }));
}

export async function createApiKeyAction(
  formData: FormData,
): Promise<{ success: boolean; apiKey?: string; error?: string }> {
  const name = String(formData.get("name") || "").trim();
  const publicKeyPem = String(formData.get("publicKeyPem") || "").trim();

  if (!name) {
    return { success: false, error: "Name is required" };
  }

  if (!publicKeyPem || !validatePublicKeyPem(publicKeyPem)) {
    return { success: false, error: "Valid RSA public key (PEM) is required" };
  }

  await connectDb();

  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);

  const doc = await ApiKeyModel.create({
    name,
    keyHash,
    keyPrefix: getApiKeyPrefix(apiKey),
    publicKeyPem,
    createdAt: new Date().toISOString(),
  });

  await reencryptAllEnvFilesForApiKey(doc._id.toString(), publicKeyPem);

  revalidatePath("/");
  return { success: true, apiKey };
}

export async function deleteApiKeyAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  await connectDb();
  await removeApiKeyEncryptions(id);
  await ApiKeyModel.findByIdAndDelete(new Types.ObjectId(id));
  revalidatePath("/");
}

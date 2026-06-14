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
import { generateKeyPair } from "../lib/asymmetric-crypto";
import { encrypt } from "../lib/crypto";
import { reencryptAllEnvFilesForApiKey, removeApiKeyEncryptions } from "../lib/env-reencrypt";
import type { ApiKey } from "../types";

export async function getApiKeysFromDb(): Promise<ApiKey[]> {
  await connectDb();

  const docs = await ApiKeyModel.find({}).sort({ createdAt: -1 }).lean();

  return docs.map((doc) => ({
    id: String(doc._id),
    name: doc.name,
    keyPrefix: doc.keyPrefix,
    createdAt: doc.createdAt,
  }));
}

export async function createApiKeyAction(
  formData: FormData,
): Promise<{
  success: boolean;
  apiKey?: string;
  privateKey?: string;
  error?: string;
}> {
  const name = String(formData.get("name") || "").trim();

  if (!name) {
    return { success: false, error: "Name is required" };
  }

  await connectDb();

  const apiKey = generateApiKey();
  const keyHash = hashApiKey(apiKey);
  const { publicKey, privateKey } = generateKeyPair();

  const doc = await ApiKeyModel.create({
    name,
    keyHash,
    keyPrefix: getApiKeyPrefix(apiKey),
    publicKeyPem: publicKey,
    privateKeyEnc: encrypt(privateKey),
    createdAt: new Date().toISOString(),
  });

  await reencryptAllEnvFilesForApiKey(doc._id.toString(), publicKey);

  revalidatePath("/");
  return { success: true, apiKey, privateKey };
}

export async function deleteApiKeyAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  await connectDb();
  await removeApiKeyEncryptions(id);
  await ApiKeyModel.findByIdAndDelete(new Types.ObjectId(id));
  revalidatePath("/");
}

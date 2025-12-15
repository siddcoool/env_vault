"use server";

import { Types } from "mongoose";
import { Project, EnvFile } from "../types";
import { revalidatePath } from "next/cache";
import { decrypt, encrypt } from "../lib/crypto";
import { connectDb } from "../lib/mongoose";
import { ProjectModel } from "../models/Project";

interface EnvFileDoc {
  id: string;
  name: string;
  content?: string;
  contentEnc?: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
  updatedAt?: string;
}

interface ProjectDoc {
  _id: Types.ObjectId;
  name: string;
  description?: string;
  createdAt?: string;
  envFiles?: EnvFileDoc[];
}

export async function getProjectsFromDb(): Promise<Project[]> {
  await connectDb();

  const docs = (await ProjectModel.find({}).sort({ createdAt: 1 }).lean()) as unknown as ProjectDoc[];

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? "",
    createdAt: doc.createdAt ?? new Date().toISOString(),
    envFiles:
      doc.envFiles?.map<EnvFile>((env) => ({
        id: env.id,
        name: env.name,
        content: env.contentEnc ? decrypt(env.contentEnc) : env.content ?? "",
        updatedAt: env.updatedAt ?? new Date().toISOString(),
      })) ?? [],
  }));
}

export async function createProjectAction(formData: FormData) {
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) return;

  await connectDb();

  await ProjectModel.create({
    name,
    description,
    createdAt: new Date().toISOString(),
    envFiles: [],
  });

  revalidatePath("/");
}

export async function deleteProjectAction(formData: FormData) {
  const id = String(formData.get("id") || "");
  if (!id) return;

  await connectDb();

  await ProjectModel.findByIdAndDelete(new Types.ObjectId(id));
  revalidatePath("/");
}

export async function createEnvFileAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const nameRaw = String(formData.get("name") || "").trim();
  if (!projectId || !nameRaw) return;

  await connectDb();

  const name =
    nameRaw.endsWith(".env") || nameRaw.includes(".env.") ? nameRaw : `${nameRaw}.env`;

  const envId = new Types.ObjectId().toString();
  const now = new Date().toISOString();
  const defaultContent = "# Environment Variables\n\nAPI_KEY=";
  const encrypted = encrypt(defaultContent);

  await ProjectModel.updateOne(
    { _id: new Types.ObjectId(projectId) },
    {
      $push: {
        envFiles: {
          id: envId,
          name,
          contentEnc: encrypted,
          updatedAt: now,
        },
      },
    },
  );

  revalidatePath("/");
}

export async function updateEnvFileAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const envId = String(formData.get("envId") || "");
  const content = String(formData.get("content") || "");

  if (!projectId || !envId) return;

  await connectDb();

  const now = new Date().toISOString();
  const encrypted = encrypt(content);

  await ProjectModel.updateOne(
    { _id: new Types.ObjectId(projectId), "envFiles.id": envId },
    {
      $set: {
        "envFiles.$.contentEnc": encrypted,
        "envFiles.$.updatedAt": now,
      },
    },
  );

  revalidatePath("/");
}

export async function deleteEnvFileAction(formData: FormData) {
  const projectId = String(formData.get("projectId") || "");
  const envId = String(formData.get("envId") || "");

  if (!projectId || !envId) return;

  await connectDb();

  await ProjectModel.updateOne(
    { _id: new Types.ObjectId(projectId) },
    {
      $pull: {
        envFiles: { id: envId },
      },
    },
  );

  revalidatePath("/");
}



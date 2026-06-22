"use server";

import { Types } from "mongoose";
import { Project, EnvFile } from "../types";
import { revalidatePath } from "next/cache";
import { decrypt } from "../lib/crypto";
import { connectDb } from "../lib/mongoose";
import { ProjectModel } from "../models/Project";
import { requireUser, getWorkspaceDecryptionKeyPlain } from "../lib/auth";
import {
  getPlaintextFromEnvFile,
  parseEnvToObject,
} from "../lib/env-object-utils";
import { encryptEnvValuesForWorkspace } from "../lib/workspace-reencrypt";
import { generateFileLink } from "../lib/workspace-key-utils";

interface EnvFileDoc {
  id: string;
  name: string;
  fileLink?: string;
  content?: string;
  contentEnc?: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
  valuesEnc?: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
  updatedAt?: string;
}

interface ProjectDoc {
  _id: Types.ObjectId;
  workspaceId: Types.ObjectId;
  name: string;
  description?: string;
  createdAt?: string;
  envFiles?: EnvFileDoc[];
}

function mapEnvFile(env: EnvFileDoc): EnvFile {
  const content = getPlaintextFromEnvFile(env, decrypt);
  return {
    id: env.id,
    name: env.name,
    fileLink: env.fileLink ?? "",
    content,
    updatedAt: env.updatedAt ?? new Date().toISOString(),
  };
}

export async function getProjectsFromDb(): Promise<Project[]> {
  const user = await requireUser();
  await connectDb();

  const docs = (await ProjectModel.find({ workspaceId: user.workspaceId })
    .sort({ createdAt: 1 })
    .lean()) as unknown as ProjectDoc[];

  return docs.map((doc) => ({
    id: doc._id.toString(),
    name: doc.name,
    description: doc.description ?? "",
    createdAt: doc.createdAt ?? new Date().toISOString(),
    envFiles: doc.envFiles?.map(mapEnvFile) ?? [],
  }));
}

export async function createProjectAction(formData: FormData) {
  const user = await requireUser();
  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();

  if (!name) return;

  await connectDb();

  await ProjectModel.create({
    workspaceId: new Types.ObjectId(user.workspaceId),
    name,
    description,
    createdAt: new Date().toISOString(),
    envFiles: [],
  });

  revalidatePath("/");
}

export async function deleteProjectAction(formData: FormData) {
  const user = await requireUser();
  const id = String(formData.get("id") || "");
  if (!id) return;

  await connectDb();

  await ProjectModel.findOneAndDelete({
    _id: new Types.ObjectId(id),
    workspaceId: new Types.ObjectId(user.workspaceId),
  });
  revalidatePath("/");
}

export async function createEnvFileAction(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") || "");
  const nameRaw = String(formData.get("name") || "").trim();
  if (!projectId || !nameRaw) return;

  await connectDb();

  const project = await ProjectModel.findOne({
    _id: new Types.ObjectId(projectId),
    workspaceId: new Types.ObjectId(user.workspaceId),
  }).lean();

  if (!project) return;

  const name =
    nameRaw.endsWith(".env") || nameRaw.includes(".env.") ? nameRaw : `${nameRaw}.env`;

  const envId = new Types.ObjectId().toString();
  const fileLink = generateFileLink();
  const now = new Date().toISOString();
  const values = {};
  const decryptionKey = await getWorkspaceDecryptionKeyPlain(user.workspaceId);
  const encrypted = await encryptEnvValuesForWorkspace(values, decryptionKey);

  await ProjectModel.updateOne(
    { _id: new Types.ObjectId(projectId) },
    {
      $push: {
        envFiles: {
          id: envId,
          name,
          fileLink,
          valuesEnc: encrypted.valuesEnc,
          valuesEncClient: encrypted.valuesEncClient,
          updatedAt: now,
        },
      },
    },
  );

  revalidatePath("/");
}

export async function updateEnvFileAction(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") || "");
  const envId = String(formData.get("envId") || "");
  const content = String(formData.get("content") || "");

  if (!projectId || !envId) return;

  await connectDb();

  const project = await ProjectModel.findOne({
    _id: new Types.ObjectId(projectId),
    workspaceId: new Types.ObjectId(user.workspaceId),
  }).lean();

  if (!project) return;

  const values = parseEnvToObject(content);
  const decryptionKey = await getWorkspaceDecryptionKeyPlain(user.workspaceId);
  const encrypted = await encryptEnvValuesForWorkspace(values, decryptionKey);
  const now = new Date().toISOString();

  await ProjectModel.updateOne(
    { _id: new Types.ObjectId(projectId), "envFiles.id": envId },
    {
      $set: {
        "envFiles.$.valuesEnc": encrypted.valuesEnc,
        "envFiles.$.valuesEncClient": encrypted.valuesEncClient,
        "envFiles.$.updatedAt": now,
      },
    },
  );

  revalidatePath("/");
}

export async function deleteEnvFileAction(formData: FormData) {
  const user = await requireUser();
  const projectId = String(formData.get("projectId") || "");
  const envId = String(formData.get("envId") || "");

  if (!projectId || !envId) return;

  await connectDb();

  await ProjectModel.updateOne(
    {
      _id: new Types.ObjectId(projectId),
      workspaceId: new Types.ObjectId(user.workspaceId),
    },
    {
      $pull: {
        envFiles: { id: envId },
      },
    },
  );

  revalidatePath("/");
}

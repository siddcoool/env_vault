import { Types } from "mongoose";
import { encrypt } from "./crypto";
import { connectDb } from "./mongoose";
import { reencryptEnvForAllApiKeys } from "./env-reencrypt";
import { normalizeEnvFileName, projectNameRegex } from "./env-vault-utils";
import { ProjectModel } from "../models/Project";

interface EnvFileDoc {
  id: string;
  name: string;
}

export interface UpsertEnvFileParams {
  projectName: string;
  fileName: string;
  content: string;
  createProject?: boolean;
  projectDescription?: string;
}

export interface UpsertEnvFileResult {
  project: string;
  file: string;
  created: boolean;
  projectCreated: boolean;
  updatedAt: string;
}

export async function upsertEnvFile(
  params: UpsertEnvFileParams,
): Promise<UpsertEnvFileResult> {
  const {
    projectName,
    fileName,
    content,
    createProject = false,
    projectDescription = "",
  } = params;

  await connectDb();

  const trimmedProject = projectName.trim();
  if (!trimmedProject) {
    throw new EnvSyncError("Project name is required", 400);
  }

  const normalizedFile = normalizeEnvFileName(fileName);
  if (!normalizedFile) {
    throw new EnvSyncError("File name is required", 400);
  }

  let project = await ProjectModel.findOne({
    name: { $regex: projectNameRegex(trimmedProject) },
  });

  let projectCreated = false;

  if (!project) {
    if (!createProject) {
      throw new EnvSyncError("Project not found", 404);
    }

    project = await ProjectModel.create({
      name: trimmedProject,
      description: projectDescription.trim(),
      createdAt: new Date().toISOString(),
      envFiles: [],
    });
    projectCreated = true;
  }

  const projectId = project._id.toString();
  const envFiles = (project.envFiles as EnvFileDoc[] | undefined) ?? [];
  const existing = envFiles.find(
    (f) => f.name.toLowerCase() === normalizedFile.toLowerCase(),
  );

  const now = new Date().toISOString();
  const encrypted = encrypt(content);
  let envId: string;
  let created = false;

  if (existing) {
    envId = existing.id;
    await ProjectModel.updateOne(
      { _id: project._id, "envFiles.id": envId },
      {
        $set: {
          "envFiles.$.contentEnc": encrypted,
          "envFiles.$.updatedAt": now,
        },
      },
    );
  } else {
    envId = new Types.ObjectId().toString();
    created = true;
    await ProjectModel.updateOne(
      { _id: project._id },
      {
        $push: {
          envFiles: {
            id: envId,
            name: normalizedFile,
            contentEnc: encrypted,
            contentEncPublic: [],
            updatedAt: now,
          },
        },
      },
    );
  }

  await reencryptEnvForAllApiKeys(projectId, envId, content);

  return {
    project: project.name,
    file: normalizedFile,
    created,
    projectCreated,
    updatedAt: now,
  };
}

export class EnvSyncError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "EnvSyncError";
    this.status = status;
  }
}

import { Types } from "mongoose";
import { connectDb } from "./mongoose";
import { normalizeEnvFileName, projectNameRegex } from "./env-vault-utils";
import { ProjectModel } from "../models/Project";
import {
  parseEnvToObject,
} from "./env-object-utils";
import {
  encryptEnvValuesForWorkspace,
} from "./workspace-reencrypt";
import { generateFileLink } from "./workspace-key-utils";
import { getWorkspaceDecryptionKeyPlain } from "./auth";

interface EnvFileDoc {
  id: string;
  name: string;
  fileLink?: string;
}

export interface UpsertEnvFileParams {
  workspaceId: string;
  projectName: string;
  fileName: string;
  content: string;
  createProject?: boolean;
  projectDescription?: string;
}

export interface UpsertEnvFileResult {
  project: string;
  file: string;
  fileLink: string;
  created: boolean;
  projectCreated: boolean;
  updatedAt: string;
}

export async function upsertEnvFile(
  params: UpsertEnvFileParams,
): Promise<UpsertEnvFileResult> {
  const {
    workspaceId,
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
    workspaceId: new Types.ObjectId(workspaceId),
    name: { $regex: projectNameRegex(trimmedProject) },
  });

  let projectCreated = false;

  if (!project) {
    if (!createProject) {
      throw new EnvSyncError("Project not found", 404);
    }

    project = await ProjectModel.create({
      workspaceId: new Types.ObjectId(workspaceId),
      name: trimmedProject,
      description: projectDescription.trim(),
      createdAt: new Date().toISOString(),
      envFiles: [],
    });
    projectCreated = true;
  }

  const envFiles = (project.envFiles as EnvFileDoc[] | undefined) ?? [];
  const existing = envFiles.find(
    (f) => f.name.toLowerCase() === normalizedFile.toLowerCase(),
  );

  const now = new Date().toISOString();
  const values = parseEnvToObject(content);
  const decryptionKey = await getWorkspaceDecryptionKeyPlain(workspaceId);
  const encrypted = await encryptEnvValuesForWorkspace(values, decryptionKey);
  let envId: string;
  let fileLink: string;
  let created = false;

  if (existing) {
    envId = existing.id;
    fileLink = existing.fileLink ?? generateFileLink();
    await ProjectModel.updateOne(
      { _id: project._id, "envFiles.id": envId },
      {
        $set: {
          "envFiles.$.valuesEnc": encrypted.valuesEnc,
          "envFiles.$.valuesEncClient": encrypted.valuesEncClient,
          "envFiles.$.fileLink": fileLink,
          "envFiles.$.updatedAt": now,
        },
      },
    );
  } else {
    envId = new Types.ObjectId().toString();
    fileLink = generateFileLink();
    created = true;
    await ProjectModel.updateOne(
      { _id: project._id },
      {
        $push: {
          envFiles: {
            id: envId,
            name: normalizedFile,
            fileLink,
            valuesEnc: encrypted.valuesEnc,
            valuesEncClient: encrypted.valuesEncClient,
            updatedAt: now,
          },
        },
      },
    );
  }

  return {
    project: project.name,
    file: normalizedFile,
    fileLink,
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

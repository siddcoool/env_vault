import { connectDb } from "./mongoose";
import { encryptWithPublicKey } from "./asymmetric-crypto";
import { decrypt } from "./crypto";
import { ApiKeyModel } from "../models/ApiKey";
import { ProjectModel } from "../models/Project";
import type { HybridEncryptedPayload } from "./asymmetric-crypto";

interface EnvFileDoc {
  id: string;
  name: string;
  content?: string;
  contentEnc?: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
  contentEncPublic?: Array<{
    apiKeyId: string;
    payload: HybridEncryptedPayload;
  }>;
}

interface ProjectLean {
  _id: unknown;
  envFiles?: EnvFileDoc[];
}

interface ApiKeyLean {
  _id: unknown;
  publicKeyPem: string;
}

function getPlaintextContent(env: EnvFileDoc): string {
  if (env.contentEnc) {
    return decrypt(env.contentEnc);
  }
  return env.content ?? "";
}

export async function reencryptEnvForAllApiKeys(
  projectId: string,
  envId: string,
  plaintext?: string,
): Promise<void> {
  await connectDb();

  const project = await ProjectModel.findById(projectId).lean<ProjectLean>();
  if (!project) return;

  const envFile = (project.envFiles as EnvFileDoc[] | undefined)?.find(
    (e) => e.id === envId,
  );
  if (!envFile) return;

  const content = plaintext ?? getPlaintextContent(envFile);
  const apiKeys = await ApiKeyModel.find({}).lean<ApiKeyLean[]>();

  const contentEncPublic = apiKeys.map((key) => ({
    apiKeyId: String(key._id),
    payload: encryptWithPublicKey(content, key.publicKeyPem),
  }));

  await ProjectModel.updateOne(
    { _id: projectId, "envFiles.id": envId },
    { $set: { "envFiles.$.contentEncPublic": contentEncPublic } },
  );
}

export async function reencryptAllEnvFilesForApiKey(
  apiKeyId: string,
  publicKeyPem: string,
): Promise<void> {
  await connectDb();

  const projects = await ProjectModel.find({}).lean<ProjectLean[]>();

  for (const project of projects) {
    const envFiles = (project.envFiles as EnvFileDoc[] | undefined) ?? [];

    for (const envFile of envFiles) {
      const plaintext = getPlaintextContent(envFile);
      const payload = encryptWithPublicKey(plaintext, publicKeyPem);

      const existing =
        envFile.contentEncPublic?.filter((e) => e.apiKeyId !== apiKeyId) ?? [];

      await ProjectModel.updateOne(
        { _id: project._id, "envFiles.id": envFile.id },
        {
          $set: {
            "envFiles.$.contentEncPublic": [
              ...existing,
              { apiKeyId, payload },
            ],
          },
        },
      );
    }
  }
}

export async function removeApiKeyEncryptions(apiKeyId: string): Promise<void> {
  await connectDb();

  const projects = await ProjectModel.find({}).lean<ProjectLean[]>();

  for (const project of projects) {
    const envFiles = (project.envFiles as EnvFileDoc[] | undefined) ?? [];

    for (const envFile of envFiles) {
      const filtered =
        envFile.contentEncPublic?.filter((e) => e.apiKeyId !== apiKeyId) ??
        [];

      if (filtered.length !== (envFile.contentEncPublic?.length ?? 0)) {
        await ProjectModel.updateOne(
          { _id: project._id, "envFiles.id": envFile.id },
          { $set: { "envFiles.$.contentEncPublic": filtered } },
        );
      }
    }
  }
}

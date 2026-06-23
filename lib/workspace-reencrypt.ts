import { decrypt, encrypt, encryptWithKey } from "./crypto";
import { valuesToJson } from "./env-object-utils";
import { connectDb } from "./mongoose";
import { decryptionKeyToBuffer } from "./workspace-key-utils";
import { ProjectModel } from "../models/Project";

interface EnvFileDoc {
  id: string;
  valuesEnc?: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
}

export async function reencryptAllFilesForWorkspace(
  workspaceId: string,
  newDecryptionKey: string,
): Promise<void> {
  await connectDb();

  const keyBuffer = decryptionKeyToBuffer(newDecryptionKey);
  const projects = (await ProjectModel.find({ workspaceId }).lean()) as Array<{
    _id: unknown;
    envFiles?: EnvFileDoc[];
  }>;

  for (const project of projects) {
    for (const envFile of project.envFiles ?? []) {
      if (!envFile.valuesEnc) continue;

      const json = decrypt(envFile.valuesEnc);
      const valuesEncClient = encryptWithKey(json, keyBuffer);

      await ProjectModel.updateOne(
        { _id: project._id, "envFiles.id": envFile.id },
        { $set: { "envFiles.$.valuesEncClient": valuesEncClient } },
      );
    }
  }
}

export async function encryptEnvValuesForWorkspace(
  values: Record<string, string>,
  decryptionKey: string,
) {
  const json = valuesToJson(values);
  const keyBuffer = decryptionKeyToBuffer(decryptionKey);
  return {
    valuesEnc: encrypt(json),
    valuesEncClient: encryptWithKey(json, keyBuffer),
  };
}

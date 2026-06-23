import { decrypt, type EncryptedPayload } from "./crypto";
import { connectDb } from "./mongoose";
import { PasscodeModel } from "../models/Passcode";
import { ProjectModel } from "../models/Project";
import { getPlaintextFromEnvFile } from "./env-object-utils";

export interface LegacyEnvFile {
  id: string;
  name: string;
  fileLink: string;
  content: string;
}

export interface LegacyProject {
  id: string;
  name: string;
  description?: string;
  envFiles: LegacyEnvFile[];
  createdAt?: string;
}

interface PasscodeDoc {
  valueEnc: EncryptedPayload;
}

interface LegacyEnvFileDoc {
  id: string;
  name: string;
  fileLink?: string;
  content?: string;
  contentEnc?: { iv: string; authTag: string; ciphertext: string };
  valuesEnc?: { iv: string; authTag: string; ciphertext: string };
}

interface LegacyProjectDoc {
  _id: { toString(): string };
  name: string;
  description?: string;
  envFiles?: LegacyEnvFileDoc[];
  createdAt?: string;
}

export async function verifyLegacyPasscode(passcode: string): Promise<boolean> {
  await connectDb();

  const passcodeDoc = await PasscodeModel.findOne().lean<PasscodeDoc>();
  if (!passcodeDoc?.valueEnc) {
    return false;
  }

  try {
    const stored = decrypt(passcodeDoc.valueEnc);
    return stored === passcode;
  } catch {
    return false;
  }
}

export async function getLegacyProjects(): Promise<LegacyProject[]> {
  await connectDb();

  const projects = await ProjectModel.find({
    workspaceId: { $exists: false },
  }).lean<LegacyProjectDoc[]>();

  return projects.map((project) => ({
    id: project._id.toString(),
    name: project.name,
    description: project.description,
    envFiles: (project.envFiles ?? []).map((file) => {
      let content = "";
      try {
        content = getPlaintextFromEnvFile(file, decrypt);
      } catch {
        // content stays empty if decryption fails
      }
      return {
        id: file.id,
        name: file.name,
        fileLink: file.fileLink ?? "",
        content,
      };
    }),
    createdAt: project.createdAt,
  }));
}

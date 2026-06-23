import { connectDb } from "./mongoose";
import { WorkspaceModel } from "../models/Workspace";
import { hashDecryptionKey } from "./workspace-key-utils";

const DECRYPTION_KEY_PREFIX = "wdk_";

export interface AuthenticatedWorkspace {
  workspaceId: string;
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

export async function authenticateDecryptionKey(
  decryptionKey: string,
): Promise<AuthenticatedWorkspace | null> {
  if (!decryptionKey.startsWith(DECRYPTION_KEY_PREFIX)) return null;

  await connectDb();

  const keyHash = hashDecryptionKey(decryptionKey);
  const workspace = await WorkspaceModel.findOne({ decryptionKeyHash: keyHash }).lean<{
    _id: unknown;
  }>();

  if (!workspace) return null;

  return {
    workspaceId: String(workspace._id),
  };
}

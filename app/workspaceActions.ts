"use server";

import { revalidatePath } from "next/cache";
import { requireUser, rotateWorkspaceDecryptionKey } from "@/lib/auth";
import { connectDb } from "@/lib/mongoose";
import { WorkspaceModel } from "@/models/Workspace";
import type { WorkspaceInfo } from "@/types";

export async function getWorkspaceInfoAction(): Promise<WorkspaceInfo | null> {
  try {
    const user = await requireUser();
    await connectDb();

    const workspace = await WorkspaceModel.findById(user.workspaceId).lean<{
      _id: unknown;
      name: string;
      decryptionKeyPrefix: string;
    }>();

    if (!workspace) return null;

    return {
      id: String(workspace._id),
      name: workspace.name,
      decryptionKeyPrefix: workspace.decryptionKeyPrefix,
    };
  } catch {
    return null;
  }
}

export async function rotateDecryptionKeyAction(): Promise<{
  success: boolean;
  decryptionKey?: string;
  error?: string;
}> {
  try {
    const user = await requireUser();
    const decryptionKey = await rotateWorkspaceDecryptionKey(user.workspaceId);
    revalidatePath("/");
    return { success: true, decryptionKey };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to rotate key",
    };
  }
}

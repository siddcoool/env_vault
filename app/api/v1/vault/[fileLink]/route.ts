import { NextRequest, NextResponse } from "next/server";
import { Types } from "mongoose";
import { connectDb } from "@/lib/mongoose";
import {
  authenticateDecryptionKey,
  extractBearerToken,
} from "@/lib/workspace-auth";
import { ProjectModel } from "@/models/Project";

interface EnvFileDoc {
  id: string;
  name: string;
  fileLink: string;
  valuesEncClient?: {
    iv: string;
    authTag: string;
    ciphertext: string;
  };
  updatedAt?: string;
}

interface ProjectLean {
  workspaceId: Types.ObjectId;
  envFiles?: EnvFileDoc[];
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ fileLink: string }> },
) {
  const token = extractBearerToken(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization header. Use: Bearer <decryption_key>" },
      { status: 401 },
    );
  }

  const auth = await authenticateDecryptionKey(token);
  if (!auth) {
    return NextResponse.json(
      { error: "Invalid workspace decryption key" },
      { status: 401 },
    );
  }

  const { fileLink } = await context.params;
  const trimmedLink = fileLink?.trim();

  if (!trimmedLink) {
    return NextResponse.json({ error: "File link is required" }, { status: 400 });
  }

  await connectDb();

  const project = await ProjectModel.findOne({
    "envFiles.fileLink": trimmedLink,
  }).lean<ProjectLean>();

  if (!project) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  if (project.workspaceId.toString() !== auth.workspaceId) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const envFiles = project.envFiles ?? [];
  const envFile = envFiles.find((f) => f.fileLink === trimmedLink);

  if (!envFile?.valuesEncClient) {
    return NextResponse.json(
      { error: "No encrypted content available for this file" },
      { status: 404 },
    );
  }

  return NextResponse.json({
    fileLink: envFile.fileLink,
    name: envFile.name,
    updatedAt: envFile.updatedAt ?? null,
    encrypted: envFile.valuesEncClient,
  });
}

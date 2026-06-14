import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "../../../lib/mongoose";
import { authenticateApiKey } from "../../../lib/api-key-auth";
import { extractBearerToken } from "../../../lib/api-key-utils";
import { ProjectModel } from "../../../models/Project";

interface EnvFileDoc {
  id: string;
  name: string;
  contentEncPublic?: Array<{
    apiKeyId: string;
    payload: {
      encryptedKey: string;
      iv: string;
      authTag: string;
      ciphertext: string;
    };
  }>;
  updatedAt?: string;
}

function normalizeEnvFileName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.endsWith(".env") || trimmed.includes(".env.")) {
    return trimmed;
  }
  return `${trimmed}.env`;
}

export async function GET(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));

  if (!token) {
    return NextResponse.json(
      { error: "Missing Authorization header. Use: Bearer <api_key>" },
      { status: 401 },
    );
  }

  const apiKey = await authenticateApiKey(token);
  if (!apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  const projectName = request.nextUrl.searchParams.get("project")?.trim();
  const fileName = request.nextUrl.searchParams.get("file")?.trim();

  if (!projectName || !fileName) {
    return NextResponse.json(
      { error: "Query params 'project' and 'file' are required" },
      { status: 400 },
    );
  }

  await connectDb();

  const project = await ProjectModel.findOne({
    name: { $regex: new RegExp(`^${escapeRegex(projectName)}$`, "i") },
  }).lean();

  if (!project) {
    return NextResponse.json({ error: "Project not found" }, { status: 404 });
  }

  const normalizedFile = normalizeEnvFileName(fileName);
  const envFiles = (project.envFiles as EnvFileDoc[] | undefined) ?? [];
  const envFile = envFiles.find(
    (f) => f.name.toLowerCase() === normalizedFile.toLowerCase(),
  );

  if (!envFile) {
    return NextResponse.json({ error: "Env file not found" }, { status: 404 });
  }

  const encrypted = envFile.contentEncPublic?.find(
    (e) => e.apiKeyId === apiKey.id,
  );

  if (!encrypted) {
    return NextResponse.json(
      {
        error:
          "No encrypted content available for this API key. Re-save the env file after creating the key.",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    project: project.name,
    file: envFile.name,
    updatedAt: envFile.updatedAt ?? null,
    encrypted: encrypted.payload,
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

import { NextRequest, NextResponse } from "next/server";
import { connectDb } from "@/lib/mongoose";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { extractBearerToken } from "@/lib/api-key-utils";
import { EnvSyncError, upsertEnvFile } from "@/lib/env-sync";
import { normalizeEnvFileName, projectNameRegex } from "@/lib/env-vault-utils";
import { ProjectModel } from "@/models/Project";

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

interface ProjectLean {
  name: string;
  envFiles?: EnvFileDoc[];
}

interface SyncFileInput {
  file: string;
  content: string;
}

interface PutEnvBody {
  project?: string;
  file?: string;
  content?: string;
  createProject?: boolean;
  description?: string;
}

interface PostSyncBody {
  project?: string;
  files?: SyncFileInput[];
  createProject?: boolean;
  description?: string;
}

async function requireApiKey(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));

  if (!token) {
    return {
      error: NextResponse.json(
        { error: "Missing Authorization header. Use: Bearer <api_key>" },
        { status: 401 },
      ),
    };
  }

  const apiKey = await authenticateApiKey(token);
  if (!apiKey) {
    return {
      error: NextResponse.json({ error: "Invalid API key" }, { status: 401 }),
    };
  }

  return { apiKey };
}

function syncErrorResponse(error: unknown) {
  if (error instanceof EnvSyncError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}

export async function GET(request: NextRequest) {
  const auth = await requireApiKey(request);
  if ("error" in auth) return auth.error;

  const { apiKey } = auth;
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
    name: { $regex: projectNameRegex(projectName) },
  }).lean<ProjectLean>();

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

/** Upsert a single env file (create project/file if requested). */
export async function PUT(request: NextRequest) {
  const auth = await requireApiKey(request);
  if ("error" in auth) return auth.error;

  let body: PutEnvBody;
  try {
    body = (await request.json()) as PutEnvBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const project = body.project?.trim();
  const file = body.file?.trim();

  if (!project || !file) {
    return NextResponse.json(
      { error: "Body fields 'project' and 'file' are required" },
      { status: 400 },
    );
  }

  if (typeof body.content !== "string") {
    return NextResponse.json(
      { error: "Body field 'content' is required and must be a string" },
      { status: 400 },
    );
  }

  try {
    const result = await upsertEnvFile({
      projectName: project,
      fileName: file,
      content: body.content,
      createProject: body.createProject ?? false,
      projectDescription: body.description,
    });

    return NextResponse.json(result);
  } catch (error) {
    return syncErrorResponse(error);
  }
}

/** Bulk sync multiple env files into a project. */
export async function POST(request: NextRequest) {
  const auth = await requireApiKey(request);
  if ("error" in auth) return auth.error;

  let body: PostSyncBody;
  try {
    body = (await request.json()) as PostSyncBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const project = body.project?.trim();
  if (!project) {
    return NextResponse.json(
      { error: "Body field 'project' is required" },
      { status: 400 },
    );
  }

  if (!Array.isArray(body.files) || body.files.length === 0) {
    return NextResponse.json(
      { error: "Body field 'files' must be a non-empty array" },
      { status: 400 },
    );
  }

  for (const entry of body.files) {
    if (!entry?.file?.trim()) {
      return NextResponse.json(
        { error: "Each file entry must include a 'file' name" },
        { status: 400 },
      );
    }
    if (typeof entry.content !== "string") {
      return NextResponse.json(
        { error: `File '${entry.file}' must include string 'content'` },
        { status: 400 },
      );
    }
  }

  const results = [];
  let projectCreated = false;
  let resolvedProject = project;

  try {
    for (let i = 0; i < body.files.length; i++) {
      const entry = body.files[i];
      const result = await upsertEnvFile({
        projectName: project,
        fileName: entry.file,
        content: entry.content,
        createProject: (body.createProject ?? false) && i === 0,
        projectDescription: body.description,
      });
      resolvedProject = result.project;
      if (result.projectCreated) {
        projectCreated = true;
      }
      results.push({
        file: result.file,
        created: result.created,
        updatedAt: result.updatedAt,
      });
    }

    return NextResponse.json({
      project: resolvedProject,
      projectCreated,
      results,
    });
  } catch (error) {
    return syncErrorResponse(error);
  }
}

import { NextRequest, NextResponse } from "next/server";
import { authenticateApiKey } from "@/lib/api-key-auth";
import { extractBearerToken } from "@/lib/api-key-utils";
import { EnvSyncError, upsertEnvFile } from "@/lib/env-sync";

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

/** Upsert a single env file (create project/file if requested). */
export async function PUT(request: NextRequest) {
  const auth = await requireApiKey(request);
  if ("error" in auth) return auth.error;

  const { apiKey } = auth;

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
      workspaceId: apiKey.workspaceId,
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

  const { apiKey } = auth;

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
        workspaceId: apiKey.workspaceId,
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
        fileLink: result.fileLink,
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

import { NextRequest, NextResponse } from "next/server";
import {
  authenticateDecryptionKey,
  extractBearerToken,
} from "@/lib/workspace-auth";
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

async function requireDecryptionKey(request: NextRequest) {
  const token = extractBearerToken(request.headers.get("authorization"));

  if (!token) {
    return {
      error: NextResponse.json(
        {
          error: "Missing Authorization header. Use: Bearer <decryption_key>",
        },
        { status: 401 },
      ),
    };
  }

  const auth = await authenticateDecryptionKey(token);
  if (!auth) {
    return {
      error: NextResponse.json(
        { error: "Invalid workspace decryption key" },
        { status: 401 },
      ),
    };
  }

  return { auth };
}

function syncErrorResponse(error: unknown) {
  if (error instanceof EnvSyncError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }
  throw error;
}

/** Upsert a single env file (create project/file if requested). */
export async function PUT(request: NextRequest) {
  const authResult = await requireDecryptionKey(request);
  if ("error" in authResult) return authResult.error;

  const { auth } = authResult;

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
      workspaceId: auth.workspaceId,
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
  const authResult = await requireDecryptionKey(request);
  if ("error" in authResult) return authResult.error;

  const { auth } = authResult;

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
        workspaceId: auth.workspaceId,
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

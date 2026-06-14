import {
  decryptWithPrivateKey,
  parseEnvContent,
  type HybridEncryptedPayload,
} from "./decrypt";

export interface EnvVaultConfig {
  /** Your EnvVault API key (evk_...) */
  apiKey: string;
  /** RSA private key PEM used to decrypt env content */
  privateKey: string;
  /** EnvVault server URL, e.g. https://envvault.example.com */
  baseUrl: string;
}

export interface GetEnvParams {
  /** Project name */
  project: string;
  /** Env file name, e.g. ".env.production" */
  file: string;
}

export interface EnvResponse {
  project: string;
  file: string;
  updatedAt: string | null;
  content: string;
  parsed: Record<string, string>;
}

interface ApiResponse {
  project: string;
  file: string;
  updatedAt: string | null;
  encrypted: HybridEncryptedPayload;
}

export interface SyncEnvParams {
  /** Project name (folder in EnvVault) */
  project: string;
  /** Env file name, e.g. ".env.production" */
  file: string;
  /** Raw .env file content */
  content: string;
  /** Create the project if it does not exist */
  createProject?: boolean;
  /** Optional description when creating a new project */
  description?: string;
}

export interface SyncEnvResult {
  project: string;
  file: string;
  created: boolean;
  projectCreated: boolean;
  updatedAt: string;
}

export interface SyncEnvBulkParams {
  project: string;
  files: Array<{ file: string; content: string }>;
  createProject?: boolean;
  description?: string;
}

export interface SyncEnvBulkResult {
  project: string;
  projectCreated: boolean;
  results: Array<{
    file: string;
    created: boolean;
    updatedAt: string;
  }>;
}

interface PutEnvResponse {
  project: string;
  file: string;
  created: boolean;
  projectCreated: boolean;
  updatedAt: string;
}

interface PostSyncResponse {
  project: string;
  projectCreated: boolean;
  results: Array<{
    file: string;
    created: boolean;
    updatedAt: string;
  }>;
}

export class EnvVault {
  private apiKey: string;
  private privateKey: string;
  private baseUrl: string;

  constructor(config: EnvVaultConfig) {
    this.apiKey = config.apiKey;
    this.privateKey = config.privateKey;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  async getEnv(params: GetEnvParams): Promise<EnvResponse> {
    const url = new URL(`${this.baseUrl}/api/v1/env`);
    url.searchParams.set("project", params.project);
    url.searchParams.set("file", params.file);

    const response = await fetch(url.toString(), {
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        body.error ?? `EnvVault API error: ${response.status} ${response.statusText}`,
      );
    }

    const data = (await response.json()) as ApiResponse;
    const content = decryptWithPrivateKey(data.encrypted, this.privateKey);

    return {
      project: data.project,
      file: data.file,
      updatedAt: data.updatedAt,
      content,
      parsed: parseEnvContent(content),
    };
  }

  /** Returns only the raw decrypted .env string */
  async getEnvRaw(params: GetEnvParams): Promise<string> {
    const result = await this.getEnv(params);
    return result.content;
  }

  /** Returns parsed key-value pairs from the env file */
  async getEnvParsed(params: GetEnvParams): Promise<Record<string, string>> {
    const result = await this.getEnv(params);
    return result.parsed;
  }

  /** Upload or update a single env file in EnvVault */
  async syncEnv(params: SyncEnvParams): Promise<SyncEnvResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/env`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: params.project,
        file: params.file,
        content: params.content,
        createProject: params.createProject ?? false,
        description: params.description,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        body.error ?? `EnvVault API error: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as PutEnvResponse;
  }

  /** Bulk upload or update multiple env files */
  async syncEnvBulk(params: SyncEnvBulkParams): Promise<SyncEnvBulkResult> {
    const response = await fetch(`${this.baseUrl}/api/v1/env`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        project: params.project,
        files: params.files,
        createProject: params.createProject ?? false,
        description: params.description,
      }),
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
      };
      throw new Error(
        body.error ?? `EnvVault API error: ${response.status} ${response.statusText}`,
      );
    }

    return (await response.json()) as PostSyncResponse;
  }
}

export { decryptWithPrivateKey, parseEnvContent };
export type { HybridEncryptedPayload };

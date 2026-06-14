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
}

export { decryptWithPrivateKey, parseEnvContent };
export type { HybridEncryptedPayload };

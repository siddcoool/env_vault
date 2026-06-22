import {
  decryptWithWorkspaceKey,
  parseValuesJson,
  type EncryptedPayload,
} from "./decrypt-workspace";

export interface VaultConfig {
  /** Workspace decryption key (wdk_...) — used for API auth and decryption */
  decryptionKey: string;
  /** Unique file link (vl_...) */
  fileLink: string;
  /** EnvVault server URL, e.g. https://envvault.example.com */
  baseUrl: string;
}

interface VaultApiResponse {
  fileLink: string;
  name: string;
  updatedAt: string | null;
  encrypted: EncryptedPayload;
}

export class Vault {
  private decryptionKey: string;
  private fileLink: string;
  private baseUrl: string;
  private values: Record<string, string> = {};
  private initialized = false;

  constructor(config: VaultConfig) {
    this.decryptionKey = config.decryptionKey;
    this.fileLink = config.fileLink;
    this.baseUrl = config.baseUrl.replace(/\/$/, "");
  }

  /** Fetch and decrypt env values from the vault */
  async init(): Promise<void> {
    const url = `${this.baseUrl}/api/v1/vault/${encodeURIComponent(this.fileLink)}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.decryptionKey}`,
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

    const data = (await response.json()) as VaultApiResponse;
    const json = decryptWithWorkspaceKey(data.encrypted, this.decryptionKey);
    this.values = parseValuesJson(json);
    this.initialized = true;
  }

  /** Get a single env value by key */
  getKey(name: string): string | undefined {
    if (!this.initialized) {
      throw new Error("Vault not initialized. Call await vault.init() first.");
    }
    return this.values[name];
  }

  /** Get all decrypted values */
  getAll(): Record<string, string> {
    if (!this.initialized) {
      throw new Error("Vault not initialized. Call await vault.init() first.");
    }
    return { ...this.values };
  }

  /** Reload values from the server */
  async refresh(): Promise<void> {
    this.initialized = false;
    await this.init();
  }
}

export { decryptWithWorkspaceKey, parseValuesJson };
export type { EncryptedPayload };

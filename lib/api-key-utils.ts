import crypto from "crypto";

const API_KEY_PREFIX = "evk_";

export function generateApiKey(): string {
  const random = crypto.randomBytes(32).toString("base64url");
  return `${API_KEY_PREFIX}${random}`;
}

export function hashApiKey(apiKey: string): string {
  return crypto.createHash("sha256").update(apiKey).digest("hex");
}

export function getApiKeyPrefix(apiKey: string): string {
  return apiKey.slice(0, 12);
}

export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() ?? null;
}

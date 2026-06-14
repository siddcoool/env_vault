export function normalizeEnvFileName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.endsWith(".env") || trimmed.includes(".env.")) {
    return trimmed;
  }
  return `${trimmed}.env`;
}

export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function projectNameRegex(name: string): RegExp {
  return new RegExp(`^${escapeRegex(name.trim())}$`, "i");
}

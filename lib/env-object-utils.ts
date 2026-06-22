export type EnvValues = Record<string, string>;

export function parseEnvToObject(content: string): EnvValues {
  const result: EnvValues = {};

  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const eqIndex = trimmed.indexOf("=");
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

export function objectToEnv(obj: EnvValues): string {
  return Object.entries(obj)
    .map(([key, value]) => {
      const needsQuotes = /[\s#="'\\]/.test(value);
      const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
      return needsQuotes ? `${key}="${escaped}"` : `${key}=${value}`;
    })
    .join("\n");
}

export function objectToJsExport(obj: EnvValues): string {
  const lines = Object.entries(obj).map(([key, value]) => {
    const escaped = value.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
    return `  ${key}: "${escaped}",`;
  });

  return `export const values = {\n${lines.join("\n")}\n};`;
}

export function parseValuesJson(json: string): EnvValues {
  const parsed = JSON.parse(json) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Values must be a JSON object");
  }

  const result: EnvValues = {};
  for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof value !== "string") {
      throw new Error(`Value for "${key}" must be a string`);
    }
    result[key] = value;
  }
  return result;
}

export function valuesToJson(obj: EnvValues): string {
  return JSON.stringify(obj);
}

export function getPlaintextFromEnvFile(env: {
  content?: string;
  contentEnc?: { iv: string; authTag: string; ciphertext: string };
  valuesEnc?: { iv: string; authTag: string; ciphertext: string };
}, decryptFn: (payload: { iv: string; authTag: string; ciphertext: string }) => string): string {
  if (env.valuesEnc) {
    const json = decryptFn(env.valuesEnc);
    const obj = parseValuesJson(json);
    return objectToEnv(obj);
  }

  if (env.contentEnc) {
    return decryptFn(env.contentEnc);
  }

  return env.content ?? "";
}

export function getValuesFromEnvFile(
  env: {
    content?: string;
    contentEnc?: { iv: string; authTag: string; ciphertext: string };
    valuesEnc?: { iv: string; authTag: string; ciphertext: string };
  },
  decryptFn: (payload: { iv: string; authTag: string; ciphertext: string }) => string,
): EnvValues {
  if (env.valuesEnc) {
    return parseValuesJson(decryptFn(env.valuesEnc));
  }

  const plaintext = env.contentEnc
    ? decryptFn(env.contentEnc)
    : env.content ?? "";

  return parseEnvToObject(plaintext);
}

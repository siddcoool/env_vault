# EnvVault — Agent Integration Guide

Instructions for AI agents setting up EnvVault in a user's Node.js project.
EnvVault delivers secrets at runtime: the client fetches an encrypted payload,
decrypts it locally, and caches values in a **global in-memory vault**.

## Core rules

1. **Never write secrets to disk.** No `.env` files, no logging of decrypted values.
2. **Never inject vault secrets into `process.env`.** Use `getKey("NAME")` / `requireKey("NAME")`.
3. **Always add `.envvault.json` to `.gitignore`** before writing credentials into it.
4. `process.env.ENVVAULT_*` is allowed — that is client *config* (which vault to talk to), not app secrets.
5. Requires **Node.js 18+** (built-in `fetch`). Zero npm dependencies.

## What you need from the user

| Credential | Format | Where the user finds it |
|------------|--------|-------------------------|
| Workspace decryption key | `wdk_...` | Shown once at registration, or regenerated in Settings |
| File link | `vl_...` | File detail view in the EnvVault dashboard |
| Base URL | `https://...` | Wherever their EnvVault server is hosted |

If the user does not have these, stop and ask. Do not invent placeholder values
in committed code.

## Setup steps

### 1. Copy the client into the user's project

For **JavaScript / CommonJS** projects, copy these two files from this repo
into the project root:

- `envvault-shared.js` — Vault class, fetch, decrypt, global in-memory cache
- `envvault-bootstrap.js` — re-exports helpers (`loadEnvFromVault`, `getKey`, `requireKey`, `vault`)

For **TypeScript** projects, copy one file instead:

- `client/env-vault.ts` → e.g. `src/env-vault.ts`

Optionally also copy `load-script.js` (CLI to verify vault access).

### 2. Create `.envvault.json` in the project root

```json
{
  "decryptionKey": "wdk_...",
  "fileLink": "vl_...",
  "baseUrl": "https://your-envvault.example.com"
}
```

Add it to `.gitignore` first. Alternatively use shell env vars, which take
precedence: `ENVVAULT_DECRYPTION_KEY`, `ENVVAULT_FILE_LINK`, `ENVVAULT_BASE_URL`.

### 3. Initialize once in the app entrypoint

JavaScript (reads `.envvault.json` / `ENVVAULT_*` automatically):

```javascript
const { loadEnvFromVault, getKey, requireKey } = require("./envvault-bootstrap");

async function main() {
  await loadEnvFromVault();

  const dbUrl = requireKey("DATABASE_URL");
  // start the server only after the vault is loaded
}

main();
```

TypeScript (explicit config):

```typescript
import { initEnvVault, getKey, requireKey } from "./env-vault";

await initEnvVault({
  decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY!,
  fileLink: process.env.ENVVAULT_FILE_LINK!,
  baseUrl: process.env.ENVVAULT_BASE_URL!,
});
```

### 4. Replace secret reads across the codebase

Search the project for `process.env.X` where `X` is an app secret stored in the
vault, and replace:

| Before | After |
|--------|-------|
| `process.env.OPENAI_KEY` | `getKey("OPENAI_KEY")` |
| `process.env.DATABASE_URL` (must exist) | `requireKey("DATABASE_URL")` |
| Reading all secrets | `vault().getAll()` |

Do **not** replace non-secret runtime config such as `process.env.NODE_ENV`,
`process.env.PORT`, or the `ENVVAULT_*` variables themselves.

Any module calling `getKey()` at import time will fail — the vault must be
initialized first. Move such reads inside functions, or ensure the entrypoint
awaits `loadEnvFromVault()` / `initEnvVault()` before importing them.

### 5. Verify

```bash
node load-script.js --check
```

Expected output: `✓ Fetched and decrypted N variable(s)`. Then start the app
and confirm it boots without missing-key errors.

## API reference (client)

| Export | Description |
|--------|-------------|
| `loadEnvFromVault(cwd?)` | JS only. Reads config, fetches, decrypts, fills global vault. |
| `initEnvVault(config)` | Creates the global vault from an explicit config. Call once. |
| `getKey(name)` | Returns `string \| undefined`. |
| `requireKey(name)` | Returns `string` or throws if missing. |
| `vault()` | Returns the global vault instance (`getAll()`, `refresh()`). |

## REST API (used internally by the client)

```
GET {baseUrl}/api/v1/vault/{fileLink}
Authorization: Bearer wdk_<decryption_key>
```

Returns an AES-256-GCM encrypted JSON object; the client decrypts it with the
same `wdk_` key. Plaintext never leaves the client process.

## Troubleshooting

- **"Missing decryption key"** — no `ENVVAULT_DECRYPTION_KEY` and no `decryptionKey` in `.envvault.json`.
- **"Invalid workspace decryption key length"** — the `wdk_` key is truncated or malformed.
- **HTTP 401/403** — key does not match the workspace, or was regenerated in Settings; ask the user for the current key.
- **"Vault not initialized"** — `getKey()` was called before `loadEnvFromVault()` / `initEnvVault()` resolved.

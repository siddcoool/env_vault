# EnvVault + Express setup

Load secrets from EnvVault at runtime into a process-wide in-memory vault.
Use `getKey("NAME")` instead of `process.env.NAME`.

## How it works

```text
node server.js
    → loadEnvFromVault() / initEnvVault() in entrypoint
    → GET /api/v1/vault/{fileLink}
    → decrypt with workspace decryption key (wdk_...)
    → store in global in-memory vault
    → getKey("DATABASE_URL") anywhere in the app
```

## Prerequisites

1. **EnvVault account** with a project and env file.
2. **Workspace decryption key** (`wdk_...`) — shown once at registration (or regenerated in Settings).
3. **File link** (`vl_...`) — copy from the file detail view in the dashboard.

## Quick start

### 1. Copy scripts to your Express project root

| File | Purpose |
|------|---------|
| `envvault-shared.js` | Vault class, fetch, decrypt, global in-memory cache |
| `envvault-bootstrap.js` | Re-exports shared helpers (`loadEnvFromVault`, `getKey`, …) |
| `load-script.js` | Optional CLI to validate vault access |

### 2. Create `.envvault.json`

```json
{
  "decryptionKey": "wdk_your_workspace_key_here",
  "fileLink": "vl_your_file_link_here",
  "baseUrl": "https://your-envvault.example.com"
}
```

Or set environment variables for **client config only** (not your app secrets):

```bash
export ENVVAULT_DECRYPTION_KEY="wdk_..."
export ENVVAULT_FILE_LINK="vl_..."
export ENVVAULT_BASE_URL="https://your-envvault.example.com"
```

Add `.envvault.json` to `.gitignore`.

### 3. Load once in your entrypoint, then use `getKey`

```javascript
const { loadEnvFromVault, getKey, requireKey } = require("./envvault-bootstrap");

async function main() {
  await loadEnvFromVault();

  const openaiKey = getKey("OPENAI_KEY");
  const dbUrl = requireKey("DATABASE_URL");

  // start Express / your server
}

main();
```

Or with an explicit config object:

```javascript
const { initEnvVault, getKey } = require("./envvault-bootstrap");

async function main() {
  await initEnvVault({
    decryptionKey: "wdk_...",
    fileLink: "vl_...",
    baseUrl: "https://your-envvault.example.com",
  });

  const openaiKey = getKey("OPENAI_KEY");
}
```

## TypeScript client

Copy **`client/env-vault.ts`** into your project and see **`docs/client-sdk.md`**.

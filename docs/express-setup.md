# EnvVault + Express setup

Load environment variables from EnvVault at runtime using the Vault client pattern.

## How it works

```text
npm run dev
    → envvault-run.js (or bootstrap in server.js)
    → GET /api/v1/vault/{fileLink}
    → decrypt with workspace decryption key (wdk_...)
    → process.env.KEY = value  (in memory only)
    → nodemon / node starts Express
```

## Prerequisites

1. **EnvVault account** with a project and env file.
2. **Workspace decryption key** (`wdk_...`) — shown once at registration (or regenerated in Settings).
3. **File link** (`vl_...`) — copy from the file detail view in the dashboard.

## Quick start

### 1. Copy scripts to your Express project root

| File | Purpose |
|------|---------|
| `envvault-shared.js` | Vault class, fetch, decrypt, inject into `process.env` |
| `envvault-bootstrap.js` | Re-exports shared helpers |
| `envvault-run.js` | Load env, then run `nodemon` / `node` |
| `load-script.js` | Optional CLI to validate vault access |

### 2. Create `.envvault.json`

```json
{
  "decryptionKey": "wdk_your_workspace_key_here",
  "fileLink": "vl_your_file_link_here",
  "baseUrl": "https://your-envvault.example.com"
}
```

Or set environment variables:

```bash
export ENVVAULT_DECRYPTION_KEY="wdk_..."
export ENVVAULT_FILE_LINK="vl_..."
export ENVVAULT_BASE_URL="https://your-envvault.example.com"
```

Add `.envvault.json` to `.gitignore`.

### 3. Use the Vault class directly

```javascript
const { Vault } = require("./envvault-shared");

async function main() {
  const vault = new Vault({
    decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY,
    fileLink: process.env.ENVVAULT_FILE_LINK,
    baseUrl: process.env.ENVVAULT_BASE_URL,
  });

  await vault.init();

  // Use instead of process.env
  const openaiKey = vault.getKey("OPENAI_KEY");
}
```

### 4. Or inject into process.env at startup

```javascript
const { loadEnvFromVault } = require("./envvault-bootstrap");

async function main() {
  await loadEnvFromVault(); // injects into process.env
  // ... express app
}
```

### 5. package.json dev script

```json
"dev": "node envvault-run.js nodemon server.js"
```

## TypeScript client

Copy **`client/env-vault.ts`** into your project and see **`docs/client-sdk.md`**.

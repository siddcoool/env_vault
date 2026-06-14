# EnvVault + Express setup

Load environment variables from EnvVault at runtime — **no local `.env` file** required. Secrets are fetched from the cloud, decrypted in memory, and injected into `process.env` when your server starts.

## How it works

```text
npm run dev
    → envvault-run.js (or bootstrap in server.js)
    → GET /api/v1/env?project=my-app&file=.env
    → decrypt with your RSA private key
    → process.env.KEY = value  (in memory only)
    → nodemon / node starts Express
```

Every server start fetches fresh values from EnvVault. Nothing is written to disk.

---

## Prerequisites

1. **EnvVault account** with your project and env file uploaded (use `sync-script.js` or the UI).
2. **API key** from EnvVault UI → **API Keys**.
3. **RSA private key** (`private.pem`) — the matching public key was used when the API key was created. EnvVault encrypts env content for your public key; only your private key can decrypt it.

---

## Quick start

### 1. Copy scripts to your Express project root

Copy these files from the EnvVault repo into your Express app root:

| File | Purpose |
|------|---------|
| `envvault-shared.js` | Config, fetch, decrypt, inject into `process.env` |
| `envvault-bootstrap.js` | Re-exports shared helpers for `require()` in your app |
| `envvault-run.js` | Load env, then run `nodemon` / `node` |
| `load-script.js` | Optional CLI to inspect or validate vault env |
| `sync-script.js` | Optional — push local `.env` files to vault (upload only) |

You can also copy `.envvault.example.json` as a starting point.

### 2. Create `.envvault.json`

```json
{
  "apiKey": "evk_your_api_key_here",
  "baseUrl": "https://env.classyendeavors.com",
  "project": "my-express-app",
  "loadFile": ".env",
  "privateKeyPath": "./private.pem"
}
```

| Field | Description |
|-------|-------------|
| `apiKey` | Your `evk_...` API key |
| `baseUrl` | EnvVault server URL |
| `project` | Project (folder) name in EnvVault |
| `loadFile` | Which env file to load at startup (e.g. `.env`, `.env.local`) |
| `privateKeyPath` | Path to your RSA private key PEM file |

Add `.envvault.json` and `private.pem` to `.gitignore` — never commit them.

### 3. Place your private key

Save the private key you received when creating the API key:

```text
my-express-app/
  private.pem          ← gitignored
  .envvault.json       ← gitignored
  server.js
```

Alternatively, set the key via environment variable (no file on disk):

```bash
export ENVVAULT_PRIVATE_KEY="$(cat private.pem)"
```

### 4. Update `package.json` scripts

**Option A — wrapper script (recommended)**

No changes to `server.js`. Env is loaded before nodemon/node starts:

```json
{
  "scripts": {
    "dev": "node envvault-run.js nodemon server.js",
    "start": "node envvault-run.js node server.js"
  }
}
```

**Option B — bootstrap inside `server.js`**

Load env at the top of your entry file before routes and `app.listen()`:

```js
const express = require("express");
const { loadEnvFromVault } = require("./envvault-bootstrap");

async function main() {
  await loadEnvFromVault();

  const app = express();

  app.get("/health", (_req, res) => {
    res.json({ ok: true, db: process.env.DATABASE_URL ? "set" : "missing" });
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Listening on ${port}`));
}

main().catch((err) => {
  console.error("Startup failed:", err.message);
  process.exit(1);
});
```

```json
{
  "scripts": {
    "dev": "nodemon server.js",
    "start": "node server.js"
  }
}
```

### 5. Remove local `.env` usage

- Delete any local `.env` with app secrets (keep vault credentials out of it too if possible).
- Remove or guard `dotenv`:

```js
// Only use dotenv as fallback when EnvVault was not used
if (!process.env.ENVVAULT_LOADED) {
  require("dotenv").config();
}
```

After a successful vault load, `process.env.ENVVAULT_LOADED` is set to `"1"`.

### 6. Run

```bash
npm run dev
```

You should see:

```text
EnvVault → loaded 12 variable(s) from my-express-app/.env
```

---

## ESM (`"type": "module"`) Express apps

Use `createRequire` to load the CommonJS bootstrap:

```js
import express from "express";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const { loadEnvFromVault } = require("./envvault-bootstrap");

async function main() {
  await loadEnvFromVault();
  // ... rest of app
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

Or use the wrapper (no bootstrap import needed):

```json
"dev": "node envvault-run.js nodemon server.js"
```

---

## Configuration reference

Environment variables override `.envvault.json`:

| Variable | Overrides |
|----------|-----------|
| `ENVVAULT_API_KEY` | `apiKey` |
| `ENVVAULT_BASE_URL` | `baseUrl` |
| `ENVVAULT_PROJECT` | `project` |
| `ENVVAULT_FILE` | `loadFile` |
| `ENVVAULT_PRIVATE_KEY` | PEM string (instead of file) |
| `ENVVAULT_PRIVATE_KEY_PATH` | `privateKeyPath` |

If `project` is omitted, the current folder name is used (same as sync script).

---

## CLI tools

### Validate vault access

```bash
node load-script.js --check
```

### Print decrypted env (stdout)

```bash
node load-script.js
```

Does **not** write a `.env` file.

### Upload local env to vault (one-time / CI)

```bash
node sync-script.js
```

---

## Uploading secrets to EnvVault

If your secrets are still in a local `.env` during initial setup:

1. Create `.envvault.json` with `apiKey`, `project`, and `files`.
2. Run `node sync-script.js` to push to the cloud.
3. Delete the local `.env`.
4. Switch to `envvault-run.js` or `loadEnvFromVault()` for daily dev.

---

## API details

Download endpoint (used by load scripts):

```http
GET /api/v1/env?project=my-app&file=.env
Authorization: Bearer evk_<api_key>
```

Response contains an `encrypted` payload. Scripts decrypt it client-side with your private key. The server never sends plaintext over the API.

See also:

- `env.md` — EnvVault server configuration
- `packages/env_vault/README.md` — TypeScript SDK (`npm install env_vault`)

---

## Troubleshooting

| Error | Fix |
|-------|-----|
| `Missing API key` | Add `apiKey` to `.envvault.json` or set `ENVVAULT_API_KEY` |
| `Private key not found` | Place `private.pem` or set `ENVVAULT_PRIVATE_KEY` |
| `Project not found` | Check `project` name matches EnvVault UI |
| `Env file not found` | Upload via UI or `sync-script.js`; check `loadFile` |
| `Invalid API key` | Regenerate key in UI; update `.envvault.json` |
| App reads empty env | Call `await loadEnvFromVault()` **before** `app.listen()` and before modules that read `process.env` at import time |
| Nodemon restart loses env | Use `envvault-run.js` wrapper, or call `loadEnvFromVault()` inside `server.js` on every start |

---

## Security notes

- **Never commit** `.envvault.json`, `private.pem`, or app `.env` files.
- The private key stays on your machine / CI runner only.
- Runtime injection means secrets exist in the Node process memory — same as `dotenv`, but without a file on disk.
- For production, prefer `envvault-run.js` or bootstrap in your Docker `CMD` / process manager start command.

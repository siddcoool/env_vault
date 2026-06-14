## EnvVault environment configuration

This document explains which environment variables EnvVault needs and shows an example `.env.local` file.

### Required environment variables

- **MONGODB_URI**: MongoDB connection string (local or Atlas).
- **MONGODB_DB**: Database name to use (default `envvault` if omitted).
- **ENCRYPTION_KEY**: 32‑byte secret key used to encrypt/decrypt env file contents with AES‑256‑GCM.

### Example `.env.local`

Create `nextjs/env_vault/.env.local` (this file is not committed to git):

```bash
MONGODB_URI="mongodb://localhost:27017/envvault"
MONGODB_DB="envvault"

# 32-byte key for AES-256-GCM encryption.
# For production, replace with a strong random key and NEVER commit it.
ENCRYPTION_KEY="dev-secret-key-32-bytes-1234567890"
```

### Notes

- The **database only stores encrypted env content**; decryption happens on the server before sending data to the UI.
- You can change `MONGODB_URI` to your Atlas URI and update `ENCRYPTION_KEY` to a secure random 32‑byte value for production.

---

## Programmatic API access

EnvVault supports fetching env files via REST API using an API key. Content is encrypted with your RSA **public key** — only your **private key** can decrypt it.

### API endpoint

```
GET /api/v1/env?project=<name>&file=<filename>
Authorization: Bearer evk_<your_api_key>
```

### Sync API (upload)

Push local env files to EnvVault programmatically. Requires the same API key used for downloads.

**Single file upsert:**

```
PUT /api/v1/env
Authorization: Bearer evk_<your_api_key>
Content-Type: application/json

{
  "project": "my-app",
  "file": ".env.local",
  "content": "KEY=value\nOTHER=123\n",
  "createProject": true,
  "description": "Optional project description"
}
```

Response:

```json
{
  "project": "my-app",
  "file": ".env.local",
  "created": true,
  "projectCreated": true,
  "updatedAt": "2026-06-14T12:00:00.000Z"
}
```

**Bulk sync:**

```
POST /api/v1/env
Authorization: Bearer evk_<your_api_key>
Content-Type: application/json

{
  "project": "my-app",
  "createProject": true,
  "files": [
    { "file": ".env", "content": "A=1\n" },
    { "file": ".env.production", "content": "B=2\n" }
  ]
}
```

### Local folder sync script (upload)

Copy `sync-script.js` to your project root, create `.envvault.json` from `.envvault.example.json`, add your `apiKey`, then run:

```bash
node sync-script.js
```

The script discovers `.env*` files in the current directory (or uses the `files` list in config) and uploads them to `https://env.classyendeavors.com`.

### Load script (download — no local `.env` file)

Copy these files to your Express (or Node) project root:

- `envvault-shared.js`
- `envvault-bootstrap.js`
- `envvault-run.js`
- `load-script.js` (optional — inspect / validate)

**Run with wrapper (recommended):**

```bash
# package.json: "dev": "node envvault-run.js nodemon server.js"
npm run dev
```

**Or bootstrap inside server.js:**

```js
const { loadEnvFromVault } = require("./envvault-bootstrap");

async function main() {
  await loadEnvFromVault(); // injects into process.env — nothing written to disk
  // ... express app
}
```

**Validate access:**

```bash
node load-script.js --check
```

Full Express setup guide: **`docs/express-setup.md`**

### Setup

1. In the EnvVault UI → **API Keys**, create a key and copy the API key and private key (shown once).
2. For Express apps: follow `docs/express-setup.md` (zero npm deps — copy scripts).
3. For TypeScript / programmatic use, install the client SDK:
   ```bash
   npm install env_vault
   ```

See `packages/env_vault/README.md` for SDK usage.



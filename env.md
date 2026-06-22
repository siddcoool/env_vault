## EnvVault environment configuration

This document explains which environment variables EnvVault needs and shows an example `.env.local` file.

### Required environment variables

- **MONGODB_URI**: MongoDB connection string (local or Atlas).
- **MONGODB_DB**: Database name to use (default `envvault` if omitted).
- **ENCRYPTION_KEY**: 32‑byte secret key used to encrypt/decrypt env file contents with AES‑256‑GCM.
- **SESSION_SECRET**: Secret for signing session cookies (min 32 characters).

### Example `.env.local`

Create `.env.local` (this file is not committed to git):

```bash
MONGODB_URI="mongodb://localhost:27017/envvault"
MONGODB_DB="envvault"

# 32-byte key for AES-256-GCM encryption.
ENCRYPTION_KEY="dev-secret-key-32-bytes-1234567890"

# Session cookie signing secret (min 32 chars)
SESSION_SECRET="dev-session-secret-min-32-chars-long!!"
```

---

## Programmatic API access

Fetch env values using an API key, workspace decryption key, and file link.

### Download endpoint

```
GET /api/v1/vault/{fileLink}
Authorization: Bearer evk_<your_api_key>
```

Response contains an AES-encrypted JSON object. Decrypt with your workspace decryption key (`wdk_...`).

### Sync API (upload)

```
PUT /api/v1/env
Authorization: Bearer evk_<your_api_key>
Content-Type: application/json

{
  "project": "my-app",
  "file": ".env.local",
  "content": "KEY=value\nOTHER=123\n",
  "createProject": true
}
```

### Client SDK

See **`docs/client-sdk.md`** and **`packages/env_vault/README.md`**.

```typescript
import { Vault } from "env_vault";

const vault = new Vault({
  apiKey: process.env.ENVVAULT_API_KEY!,
  decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY!,
  fileLink: process.env.ENVVAULT_FILE_LINK!,
  baseUrl: "https://your-envvault.example.com",
});

await vault.init();
const value = vault.getKey("OPENAI_KEY");
```

### Migration from legacy data

If upgrading from the passcode/RSA model:

```bash
MIGRATION_ADMIN_EMAIL=admin@example.com \
MIGRATION_ADMIN_PASSWORD=yourpassword \
node scripts/migrate-to-workspaces.js
```

Save the printed workspace decryption key — it is shown once.

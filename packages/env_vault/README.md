# env_vault

Client SDK for programmatic access to [EnvVault](https://github.com/your-org/env_vault) environment files.

Env content is encrypted with your RSA public key on the server. Only your private key can decrypt it — the server never sends plaintext over the API.

## Install

```bash
npm install env_vault
```

## Setup

1. Generate an RSA key pair:

```bash
openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem
```

2. In EnvVault UI → **API Keys**, paste your public key and create an API key.

3. Use the SDK in your app or CI:

```typescript
import { readFileSync } from "fs";
import { EnvVault } from "env_vault";

const vault = new EnvVault({
  apiKey: process.env.ENVVAULT_API_KEY!,
  privateKey: readFileSync("private.pem", "utf8"),
  baseUrl: "https://your-envvault.example.com",
});

const { parsed, content } = await vault.getEnv({
  project: "my-app",
  file: ".env.production",
});

console.log(parsed.DATABASE_URL);
```

## API

### `new EnvVault(config)`

| Option | Description |
|--------|-------------|
| `apiKey` | Your `evk_...` API key |
| `privateKey` | RSA private key PEM string |
| `baseUrl` | EnvVault server URL |

### `vault.getEnv({ project, file })`

Fetches and decrypts an env file. Returns:

```typescript
{
  project: string;
  file: string;
  updatedAt: string | null;
  content: string;           // raw .env text
  parsed: Record<string, string>;  // parsed KEY=value pairs
}
```

### `vault.getEnvRaw({ project, file })`

Returns only the decrypted `.env` string.

### `vault.getEnvParsed({ project, file })`

Returns only the parsed key-value object.

### `vault.syncEnv({ project, file, content, createProject?, description? })`

Uploads or updates a single env file. Set `createProject: true` to auto-create the project folder.

### `vault.syncEnvBulk({ project, files, createProject?, description? })`

Bulk upload or update multiple env files in one request.

## REST API

You can also call the API directly:

**Download:**

```
GET /api/v1/env?project=my-app&file=.env.production
Authorization: Bearer evk_...
```

**Upload (single file):**

```
PUT /api/v1/env
Authorization: Bearer evk_...
Content-Type: application/json

{ "project": "my-app", "file": ".env", "content": "KEY=value\n", "createProject": true }
```

**Bulk sync:**

```
POST /api/v1/env
Authorization: Bearer evk_...
Content-Type: application/json

{ "project": "my-app", "createProject": true, "files": [{ "file": ".env", "content": "..." }] }
```

Download response:

```json
{
  "project": "my-app",
  "file": ".env.production",
  "updatedAt": "2026-06-14T12:00:00.000Z",
  "encrypted": {
    "encryptedKey": "...",
    "iv": "...",
    "authTag": "...",
    "ciphertext": "..."
  }
}
```

Decrypt `encrypted` with your RSA private key using hybrid RSA-OAEP + AES-256-GCM.

## License

MIT

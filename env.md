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

### Setup

1. Generate an RSA key pair:
   ```bash
   openssl genrsa -out private.pem 2048
   openssl rsa -in private.pem -pubout -out public.pem
   ```
2. In the EnvVault UI → **API Keys**, create a key with your public key.
3. Install the client SDK:
   ```bash
   npm install env_vault
   ```

See `packages/env_vault/README.md` for SDK usage.



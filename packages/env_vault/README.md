# env_vault

Client SDK for programmatic access to EnvVault environment files.

## Install

```bash
npm install env_vault
```

## Setup

1. Register an account — save your **workspace decryption key** (`wdk_...`).
2. Create an **API key** (`evk_...`) in the dashboard.
3. Copy a file's **file link** (`vl_...`) from the project detail view.

## Usage

```typescript
import { Vault } from "env_vault";

const vault = new Vault({
  apiKey: process.env.ENVVAULT_API_KEY!,
  decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY!,
  fileLink: process.env.ENVVAULT_FILE_LINK!,
  baseUrl: "https://your-envvault.example.com",
});

await vault.init();

// Use instead of process.env
const dbUrl = vault.getKey("DATABASE_URL");
const all = vault.getAll();
```

## API

### `new Vault(config)`

| Option | Description |
|--------|-------------|
| `apiKey` | Your `evk_...` API key |
| `decryptionKey` | Workspace `wdk_...` decryption key |
| `fileLink` | File link `vl_...` from the dashboard |
| `baseUrl` | EnvVault server URL |

### `await vault.init()`

Fetches and decrypts env values from the vault.

### `vault.getKey(name)`

Returns a single secret value. Throws if `init()` was not called.

### `vault.getAll()`

Returns all key-value pairs.

### `await vault.refresh()`

Re-fetches values from the server.

## REST API

```
GET /api/v1/vault/vl_abc123
Authorization: Bearer evk_...
```

See **`docs/client-sdk.md`** in the EnvVault repo.

## License

MIT

# Client SDK

Use the EnvVault SDK in your Node.js apps to fetch secrets at runtime instead of `process.env`.

## Install

```bash
npm install env_vault
```

## Setup

1. Create an account and save your **workspace decryption key** (`wdk_...`).
2. Copy a file's **file link** (`vl_...`) from the project detail view.

## Usage

```typescript
import { Vault } from "env_vault";

const vault = new Vault({
  decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY!,
  fileLink: process.env.ENVVAULT_FILE_LINK!,
  baseUrl: "https://your-envvault.example.com",
});

await vault.init();

// Use everywhere instead of process.env
const openaiKey = vault.getKey("OPENAI_KEY");
const dbUrl = vault.getKey("DATABASE_URL");

// Or get all values
const all = vault.getAll();
```

## API

### `GET /api/v1/vault/{fileLink}`

```
Authorization: Bearer wdk_<decryption_key>
```

Returns an encrypted JSON object. The SDK decrypts it with the same workspace decryption key.

## Express example

```javascript
const { Vault } = require("env_vault");

let vault;

async function getVault() {
  if (!vault) {
    vault = new Vault({
      decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY,
      fileLink: process.env.ENVVAULT_FILE_LINK,
      baseUrl: process.env.ENVVAULT_BASE_URL,
    });
    await vault.init();
  }
  return vault;
}

app.get("/api/config", async (req, res) => {
  const v = await getVault();
  res.json({ hasOpenAi: !!v.getKey("OPENAI_KEY") });
});
```

See also [express-setup.md](./express-setup.md).

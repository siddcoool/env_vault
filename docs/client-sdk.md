# Client SDK

Fetch your secrets at runtime from EnvVault instead of reading `process.env`.
Values are downloaded from your EnvVault server and **decrypted locally** with your
workspace decryption key.

> **No npm package required.** Copy a single file into your project, initialize it
> once in your server entrypoint, then use `getKey()` everywhere.

## Setup

1. Create an account and save your **workspace decryption key** (`wdk_...`).
2. Copy a file's **file link** (`vl_...`) from the project detail view.
3. Copy [`client/env-vault.ts`](../client/env-vault.ts) into your project
   (e.g. `src/env-vault.ts`). Requires Node.js 18+ (built-in `fetch`); no
   external dependencies.

## 1. Initialize once in your entrypoint

In your server root (`main.ts` / `index.ts`), call `initEnvVault(...)` before
starting your app. The constructor registers a single **global instance**, so you
never pass it around.

```typescript
// main.ts
import { initEnvVault } from "./env-vault";

await initEnvVault({
  decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY!,
  fileLink: process.env.ENVVAULT_FILE_LINK!,
  baseUrl: "https://your-envvault.example.com",
});

// ... now start your server / app
```

## 2. Use `getKey()` anywhere instead of `process.env`

```typescript
// any-file.ts
import { getKey, requireKey } from "./env-vault";

const openaiKey = getKey("OPENAI_KEY");        // string | undefined
const dbUrl = requireKey("DATABASE_URL");      // throws if missing
```

No need to re-create or import the instance — it lives on the global singleton
created during `initEnvVault(...)`.

## API

| Export | Description |
|--------|-------------|
| `initEnvVault(config)` | Creates the global instance and loads + decrypts secrets. Call once. |
| `getKey(name)` | Returns a single value (`string \| undefined`). Drop-in for `process.env.X`. |
| `requireKey(name)` | Returns a value or throws if missing. |
| `vault()` | Returns the global `EnvVault` instance. |
| `vault().getAll()` | Returns all decrypted key-value pairs. |
| `vault().refresh()` | Re-fetches values from the server. |

`config` fields: `decryptionKey` (`wdk_...`), `fileLink` (`vl_...`), `baseUrl`.

## REST API (used internally)

### `GET /api/v1/vault/{fileLink}`

```
Authorization: Bearer wdk_<decryption_key>
```

Returns an encrypted JSON object. The client decrypts it with the same workspace
decryption key.

## Express example

```javascript
// main.js
const { initEnvVault, getKey } = require("./env-vault");

async function start() {
  await initEnvVault({
    decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY,
    fileLink: process.env.ENVVAULT_FILE_LINK,
    baseUrl: process.env.ENVVAULT_BASE_URL,
  });

  const app = require("express")();

  app.get("/api/config", (req, res) => {
    res.json({ hasOpenAi: !!getKey("OPENAI_KEY") });
  });

  app.listen(3000);
}

start();
```

See also [express-setup.md](./express-setup.md).

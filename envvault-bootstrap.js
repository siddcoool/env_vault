/**
 * EnvVault bootstrap for Express (and other Node apps).
 *
 * Call loadEnvFromVault() once in your entrypoint, then use getKey("NAME")
 * anywhere instead of process.env.NAME. Secrets stay in a process-wide global.
 *
 * CommonJS:
 *   const { loadEnvFromVault, getKey } = require("./envvault-bootstrap");
 *
 *   async function main() {
 *     await loadEnvFromVault();
 *     const dbUrl = getKey("DATABASE_URL");
 *     // start Express / your server
 *   }
 *
 * ESM (with createRequire):
 *   import { createRequire } from "module";
 *   const require = createRequire(import.meta.url);
 *   const { loadEnvFromVault, getKey } = require("./envvault-bootstrap");
 */

module.exports = require("./envvault-shared");

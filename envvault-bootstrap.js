/**
 * EnvVault bootstrap for Express (and other Node apps).
 *
 * Call loadEnvFromVault() before app.listen() or any code that reads process.env.
 * Does not write a .env file — values exist in memory only.
 *
 * CommonJS:
 *   const { loadEnvFromVault } = require("./envvault-bootstrap");
 *
 * ESM (with createRequire):
 *   import { createRequire } from "module";
 *   const require = createRequire(import.meta.url);
 *   const { loadEnvFromVault } = require("./envvault-bootstrap");
 */

module.exports = require("./envvault-shared");

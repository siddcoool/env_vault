#!/usr/bin/env node
/**
 * EnvVault run wrapper — load env from cloud, then start your app (nodemon, node, etc.)
 *
 * Usage:
 *   node envvault-run.js nodemon server.js
 *   node envvault-run.js node server.js
 *   node envvault-run.js node --watch server.js
 *
 * Add to package.json:
 *   "dev": "node envvault-run.js nodemon server.js",
 *   "start": "node envvault-run.js node server.js"
 *
 * Fetches fresh env from EnvVault on every start. No .env file is created.
 */

const { spawn } = require("child_process");
const { loadEnvFromVault } = require("./envvault-shared");

async function main() {
  const [command, ...args] = process.argv.slice(2);

  if (!command) {
    console.error("Usage: node envvault-run.js <command> [args...]");
    console.error("Example: node envvault-run.js nodemon server.js");
    process.exit(1);
  }

  const result = await loadEnvFromVault(process.cwd());

  console.error(`EnvVault → loaded ${result.keysLoaded} variable(s) from ${result.project}/${result.file}`);

  const child = spawn(command, args, {
    stdio: "inherit",
    env: process.env,
    shell: true,
  });

  child.on("exit", (code, signal) => {
    if (signal) {
      process.kill(process.pid, signal);
      return;
    }
    process.exit(code ?? 0);
  });
}

main().catch((error) => {
  console.error(`EnvVault run failed: ${error.message}`);
  process.exit(1);
});

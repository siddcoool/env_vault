#!/usr/bin/env node
/**
 * EnvVault load script — fetch env from cloud and inject into process.env (no .env file written)
 *
 * Usage (from your project root):
 *   node load-script.js              # print decrypted env to stdout
 *   node load-script.js --apply      # inject into current process.env (for testing)
 *   node load-script.js --check      # validate fetch + decrypt only
 *
 * Configuration (in order of precedence):
 *   1. Shell: ENVVAULT_API_KEY, ENVVAULT_PROJECT, ENVVAULT_FILE, ENVVAULT_BASE_URL,
 *             ENVVAULT_PRIVATE_KEY or ENVVAULT_PRIVATE_KEY_PATH
 *   2. .envvault.json in the current directory
 *
 * Example .envvault.json:
 * {
 *   "apiKey": "evk_your_api_key_here",
 *   "baseUrl": "https://env.classyendeavors.com",
 *   "project": "my-app",
 *   "loadFile": ".env",
 *   "privateKeyPath": "./private.pem"
 * }
 */

const { loadConfig, fetchEnvFromVault, applyEnvToProcess } = require("./envvault-shared");

async function main() {
  const args = process.argv.slice(2);
  const apply = args.includes("--apply");
  const checkOnly = args.includes("--check");

  const cwd = process.cwd();
  const config = loadConfig(cwd);

  console.error(`EnvVault load ← ${config.baseUrl}`);
  console.error(`Project: ${config.project}`);
  console.error(`File: ${config.file}`);

  const result = await fetchEnvFromVault(config);

  if (checkOnly) {
    const keyCount = Object.keys(result.parsed).length;
    console.error(`✓ Fetched and decrypted ${keyCount} variable(s)`);
    if (result.updatedAt) {
      console.error(`  Last updated: ${result.updatedAt}`);
    }
    return;
  }

  if (apply) {
    const count = applyEnvToProcess(result.parsed);
    console.error(`✓ Applied ${count} variable(s) to process.env`);
    return;
  }

  process.stdout.write(result.content);
  if (!result.content.endsWith("\n")) {
    process.stdout.write("\n");
  }
}

main().catch((error) => {
  console.error(`EnvVault load failed: ${error.message}`);
  process.exit(1);
});

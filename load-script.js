#!/usr/bin/env node
/**
 * EnvVault load script — fetch env from cloud and decrypt (in memory / stdout only).
 *
 * Usage (from your project root):
 *   node load-script.js              # print decrypted env to stdout
 *   node load-script.js --check      # validate fetch + decrypt only
 *
 * Configuration (in order of precedence):
 *   1. Shell: ENVVAULT_DECRYPTION_KEY, ENVVAULT_FILE_LINK, ENVVAULT_BASE_URL
 *   2. .envvault.json in the current directory
 *
 * Example .envvault.json:
 * {
 *   "decryptionKey": "wdk_your_workspace_key_here",
 *   "fileLink": "vl_your_file_link_here",
 *   "baseUrl": "https://env.classyendeavors.com"
 * }
 */

const { loadConfig, fetchEnvFromVault } = require("./envvault-shared");

function valuesToEnvContent(parsed) {
  return Object.entries(parsed)
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");

  const cwd = process.cwd();
  const config = loadConfig(cwd);

  console.error(`EnvVault load ← ${config.baseUrl}`);
  console.error(`File link: ${config.fileLink}`);

  const result = await fetchEnvFromVault(config);
  const keyCount = Object.keys(result.parsed).length;

  if (checkOnly) {
    console.error(`✓ Fetched and decrypted ${keyCount} variable(s)`);
    if (result.name) {
      console.error(`  File: ${result.name}`);
    }
    if (result.updatedAt) {
      console.error(`  Last updated: ${result.updatedAt}`);
    }
    return;
  }

  const content = valuesToEnvContent(result.parsed);
  process.stdout.write(content);
  if (content.length > 0 && !content.endsWith("\n")) {
    process.stdout.write("\n");
  }
}

main().catch((error) => {
  console.error(`EnvVault load failed: ${error.message}`);
  process.exit(1);
});

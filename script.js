#!/usr/bin/env node
/**
 * EnvVault sync script — push local .env files to https://env.classyendeavors.com
 *
 * Usage (from your project root):
 *   node script.js
 *
 * Configuration (in order of precedence):
 *   1. Environment variables: ENVVAULT_API_KEY, ENVVAULT_PROJECT, ENVVAULT_BASE_URL
 *   2. .envvault.json in the current directory
 *
 * Example .envvault.json:
 * {
 *   "baseUrl": "https://env.classyendeavors.com",
 *   "project": "my-app",
 *   "createProject": true,
 *   "files": [".env", ".env.local", ".env.production"]
 * }
 *
 * If "files" is omitted, all .env* files in the directory are synced.
 * Set ENVVAULT_API_KEY in your shell — do not commit API keys to git.
 */

const fs = require("fs");
const path = require("path");

const DEFAULT_BASE_URL = "https://env.classyendeavors.com";
const CONFIG_FILE = ".envvault.json";

function readJsonConfig(cwd) {
  const configPath = path.join(cwd, CONFIG_FILE);
  if (!fs.existsSync(configPath)) {
    return {};
  }
  try {
    return JSON.parse(fs.readFileSync(configPath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to parse ${CONFIG_FILE}: ${error.message}`);
  }
}

function loadConfig(cwd) {
  const fileConfig = readJsonConfig(cwd);
  const folderName = path.basename(path.resolve(cwd));

  const apiKey = process.env.ENVVAULT_API_KEY || fileConfig.apiKey;
  const baseUrl = (
    process.env.ENVVAULT_BASE_URL ||
    fileConfig.baseUrl ||
    DEFAULT_BASE_URL
  ).replace(/\/$/, "");
  const project =
    process.env.ENVVAULT_PROJECT || fileConfig.project || folderName;
  const createProject =
    process.env.ENVVAULT_CREATE_PROJECT === "true" ||
    fileConfig.createProject === true;
  const description =
    process.env.ENVVAULT_DESCRIPTION || fileConfig.description || "";
  const files = fileConfig.files;

  if (!apiKey) {
    throw new Error(
      "Missing API key. Set ENVVAULT_API_KEY or add apiKey to .envvault.json",
    );
  }

  return { apiKey, baseUrl, project, createProject, description, files };
}

function discoverEnvFiles(cwd) {
  return fs
    .readdirSync(cwd, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        entry.name.startsWith(".env") &&
        entry.name !== CONFIG_FILE,
    )
    .map((entry) => entry.name)
    .sort();
}

function readEnvFiles(cwd, fileNames) {
  const files = [];
  for (const file of fileNames) {
    const filePath = path.join(cwd, file);
    if (!fs.existsSync(filePath)) {
      console.warn(`  skip ${file} (not found)`);
      continue;
    }
    files.push({
      file,
      content: fs.readFileSync(filePath, "utf8"),
    });
  }
  return files;
}

async function syncToVault(config, files) {
  const response = await fetch(`${config.baseUrl}/api/v1/env`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      project: config.project,
      files,
      createProject: config.createProject,
      description: config.description,
    }),
  });

  const body = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(body.error || `HTTP ${response.status} ${response.statusText}`);
  }

  return body;
}

async function main() {
  const cwd = process.cwd();
  const config = loadConfig(cwd);

  const fileNames =
    Array.isArray(config.files) && config.files.length > 0
      ? config.files
      : discoverEnvFiles(cwd);

  if (fileNames.length === 0) {
    console.log("No .env files found to sync.");
    process.exit(0);
  }

  const files = readEnvFiles(cwd, fileNames);
  if (files.length === 0) {
    console.log("No readable .env files to sync.");
    process.exit(0);
  }

  console.log(`EnvVault sync → ${config.baseUrl}`);
  console.log(`Project: ${config.project}`);
  console.log(`Files: ${files.map((f) => f.file).join(", ")}`);

  const result = await syncToVault(config, files);

  if (result.projectCreated) {
    console.log(`Created project "${result.project}"`);
  }

  for (const entry of result.results) {
    const action = entry.created ? "created" : "updated";
    console.log(`  ✓ ${entry.file} ${action} (${entry.updatedAt})`);
  }

  console.log("Sync complete.");
}

main().catch((error) => {
  console.error(`EnvVault sync failed: ${error.message}`);
  process.exit(1);
});

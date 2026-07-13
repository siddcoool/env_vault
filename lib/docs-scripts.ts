import fs from "fs";
import path from "path";
import type { DocsClientScript } from "@/types";

export type { DocsClientScript };

const SCRIPT_DEFS = [
  {
    filename: "envvault-shared.js",
    description: "Fetch, decrypt, inject into process.env",
  },
  {
    filename: "envvault-bootstrap.js",
    description: "Bootstrap helper",
  },
  {
    filename: "envvault-run.js",
    description: "Load env, then run nodemon / node",
  },
] as const;

export function getDocsClientScripts(): DocsClientScript[] {
  const root = process.cwd();

  return SCRIPT_DEFS.map(({ filename, description }) => ({
    filename,
    description,
    content: fs.readFileSync(path.join(root, filename), "utf8"),
  }));
}

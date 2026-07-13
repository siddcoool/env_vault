"use client";

import React, { useState } from "react";
import { Check, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { DocsClientScript } from "@/types";

function Step({
  number,
  title,
  children,
}: {
  number: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-lg border p-4">
      <h2 className="flex items-center gap-2 font-medium">
        <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
          {number}
        </span>
        {title}
      </h2>
      <div className="mt-3 space-y-3 text-sm text-muted-foreground">{children}</div>
    </section>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="overflow-x-auto rounded border bg-muted p-3 text-xs text-foreground">
      <code>{children}</code>
    </pre>
  );
}

function FilePreview({ script }: { script: DocsClientScript }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(script.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="overflow-hidden rounded-lg border">
      <div className="flex items-start gap-3 border-b bg-muted/50 px-3 py-2">
        <div className="min-w-0 flex-1">
          <p className="truncate font-mono text-sm font-medium text-foreground">
            {script.filename}
          </p>
          <p className="text-xs text-muted-foreground">{script.description}</p>
        </div>
        <Button
          variant="outline"
          size="icon-sm"
          className="shrink-0"
          onClick={handleCopy}
          aria-label={`Copy ${script.filename}`}
        >
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
      <pre className="max-h-80 overflow-auto bg-muted/30 p-3 text-xs leading-relaxed text-foreground">
        <code>{script.content}</code>
      </pre>
    </div>
  );
}

interface DocsPanelProps {
  scripts: DocsClientScript[];
}

export function DocsPanel({ scripts }: DocsPanelProps) {
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Docs</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Run EnvVault locally and connect your apps
        </p>
      </div>

      <div className="mb-8 max-w-3xl space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Run EnvVault on your machine
        </h2>

        <Step number={1} title="Install prerequisites">
          <ul className="list-disc space-y-1 pl-5">
            <li>
              <strong className="text-foreground">Node.js 18+</strong> (LTS
              recommended)
            </li>
            <li>
              <strong className="text-foreground">MongoDB</strong> running
              locally or a MongoDB Atlas connection string
            </li>
            <li>
              <strong className="text-foreground">Git</strong> to clone the
              repository
            </li>
          </ul>
        </Step>

        <Step number={2} title="Clone and install dependencies">
          <CodeBlock>{`git clone <your-envvault-repo-url>
cd env_vault
npm install`}</CodeBlock>
        </Step>

        <Step number={3} title="Create .env.local">
          <p>
            In the project root, create{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              .env.local
            </code>{" "}
            (do not commit this file):
          </p>
          <CodeBlock>{`MONGODB_URI="mongodb://localhost:27017/envvault"
MONGODB_DB="envvault"

# 32-byte key for AES-256-GCM encryption
ENCRYPTION_KEY="dev-secret-key-32-bytes-1234567890"

# Session cookie signing secret (min 32 chars)
SESSION_SECRET="dev-session-secret-min-32-chars-long!!"`}</CodeBlock>
          <p>
            Use strong random values for{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              ENCRYPTION_KEY
            </code>{" "}
            and{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              SESSION_SECRET
            </code>{" "}
            outside of local development.
          </p>
        </Step>

        <Step number={4} title="Start the app">
          <CodeBlock>{`npm run dev`}</CodeBlock>
          <p>
            Open{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              http://localhost:3000
            </code>
            , register an account, and save your workspace decryption key (
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              wdk_…
            </code>
            ) when it is shown — it appears only once.
          </p>
        </Step>

        <Step number={5} title="Create a project and env file">
          <ol className="list-decimal space-y-1 pl-5">
            <li>From the dashboard, create a project.</li>
            <li>
              Add an env file (for example{" "}
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                .env.local
              </code>
              ) and paste your secrets.
            </li>
            <li>
              Copy the file link (
              <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
                vl_…
              </code>
              ) from the file detail view — you will need it in your client app.
            </li>
          </ol>
        </Step>
      </div>

      <div className="max-w-3xl space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Connect your own app (local)
        </h2>

        <Step number={1} title="Copy client scripts into your app root">
          <p>
            Copy these files into your app root. Preview and copy each file
            below:
          </p>
          <div className="space-y-3">
            {scripts.map((script) => (
              <FilePreview key={script.filename} script={script} />
            ))}
          </div>
          <p>
            Or TypeScript:{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              client/env-vault.ts
            </code>
          </p>
        </Step>

        <Step number={2} title="Create .envvault.json in your app">
          <CodeBlock>{`{
  "decryptionKey": "wdk_your_workspace_key_here",
  "fileLink": "vl_your_file_link_here",
  "baseUrl": "http://localhost:3000"
}`}</CodeBlock>
          <p>
            Point{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              baseUrl
            </code>{" "}
            at your local EnvVault. Add{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              .envvault.json
            </code>{" "}
            to{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs text-foreground">
              .gitignore
            </code>
            .
          </p>
          <p>Or use environment variables instead:</p>
          <CodeBlock>{`export ENVVAULT_DECRYPTION_KEY="wdk_..."
export ENVVAULT_FILE_LINK="vl_..."
export ENVVAULT_BASE_URL="http://localhost:3000"`}</CodeBlock>
        </Step>

        <Step number={3} title="Load secrets at startup">
          <p>Option A — inject into process.env:</p>
          <CodeBlock>{`const { loadEnvFromVault } = require("./envvault-bootstrap");

async function main() {
  await loadEnvFromVault();
  // start Express / your server
}`}</CodeBlock>
          <p>Option B — package.json dev script:</p>
          <CodeBlock>{`"dev": "node envvault-run.js nodemon server.js"`}</CodeBlock>
          <p>Option C — TypeScript client:</p>
          <CodeBlock>{`import { initEnvVault, getKey } from "./env-vault";

await initEnvVault({
  decryptionKey: process.env.ENVVAULT_DECRYPTION_KEY!,
  fileLink: process.env.ENVVAULT_FILE_LINK!,
  baseUrl: "http://localhost:3000",
});

const openaiKey = getKey("OPENAI_KEY");`}</CodeBlock>
        </Step>

        <Step number={4} title="Verify the API (optional)">
          <p>With EnvVault running locally:</p>
          <CodeBlock>{`curl -H "Authorization: Bearer wdk_YOUR_KEY" \\
  http://localhost:3000/api/v1/vault/vl_YOUR_FILE_LINK`}</CodeBlock>
          <p>
            You should get an encrypted JSON payload. The client decrypts it
            locally with your workspace key.
          </p>
        </Step>
      </div>
    </div>
  );
}

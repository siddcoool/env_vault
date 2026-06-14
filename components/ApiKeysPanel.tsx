"use client";

import React, { useState } from "react";
import { Key, Plus, Trash2, Copy, Check } from "lucide-react";
import { ApiKey } from "../types";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { Input } from "./ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import { createApiKeyAction, deleteApiKeyAction } from "../app/apiKeyActions";

interface ApiKeysPanelProps {
  apiKeys: ApiKey[];
}

export const ApiKeysPanel: React.FC<ApiKeysPanelProps> = ({ apiKeys }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [publicKeyPem, setPublicKeyPem] = useState("");
  const [error, setError] = useState("");
  const [createdKey, setCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    const data = new FormData();
    data.append("name", name);
    data.append("publicKeyPem", publicKeyPem);

    const result = await createApiKeyAction(data);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Failed to create API key");
      return;
    }

    setCreatedKey(result.apiKey ?? null);
    setName("");
    setPublicKeyPem("");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCreatedKey(null);
    setError("");
    setCopied(false);
  };

  const handleCopy = async () => {
    if (!createdKey) return;
    await navigator.clipboard.writeText(createdKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = (id: string) => {
    const data = new FormData();
    data.append("id", id);
    void deleteApiKeyAction(data);
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-5 flex items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold tracking-tight">API Keys</h1>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Programmatic access to env files. Env is encrypted with your public
            key — only your private key can decrypt it.
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus />
          New API Key
        </Button>
      </div>

      <div className="mb-6 rounded-lg border bg-muted/30 p-4 text-sm">
        <p className="font-medium">How it works</p>
        <ol className="mt-2 list-decimal space-y-1 pl-4 text-muted-foreground">
          <li>Generate an RSA key pair and paste your public key here.</li>
          <li>Create an API key — copy it immediately (shown once).</li>
          <li>
            Use the{" "}
            <code className="rounded bg-muted px-1 py-0.5 text-xs">env_vault</code>{" "}
            npm package with your API key and private key.
          </li>
        </ol>
        <pre className="mt-3 overflow-x-auto rounded bg-background p-3 text-xs">
{`openssl genrsa -out private.pem 2048
openssl rsa -in private.pem -pubout -out public.pem`}
        </pre>
      </div>

      {apiKeys.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-16 text-center">
          <Key className="mb-3 size-10 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No API keys yet</p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Key prefix</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {apiKeys.map((key) => (
              <TableRow key={key.id}>
                <TableCell className="font-medium">{key.name}</TableCell>
                <TableCell>
                  <code className="text-xs">{key.keyPrefix}…</code>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(key.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => handleDelete(key.id)}
                    aria-label="Delete API key"
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create API Key">
        {createdKey ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy your API key now. It will not be shown again.
            </p>
            <div className="flex items-center gap-2">
              <code className="flex-1 overflow-x-auto rounded border bg-muted p-2 text-xs">
                {createdKey}
              </code>
              <Button variant="outline" size="icon-sm" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
            <Button className="w-full" onClick={handleCloseModal}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium">Name</label>
              <Input
                placeholder="CI pipeline"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">
                RSA Public Key (PEM)
              </label>
              <textarea
                className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="-----BEGIN PUBLIC KEY-----&#10;...&#10;-----END PUBLIC KEY-----"
                value={publicKeyPem}
                onChange={(e) => setPublicKeyPem(e.target.value)}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleCloseModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? "Creating…" : "Create"}
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
};

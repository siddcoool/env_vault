"use client";

import React, { useState } from "react";
import { Copy, Check, RefreshCw } from "lucide-react";
import { WorkspaceInfo } from "@/types";
import { Button } from "./ui/button";
import { Modal } from "./ui/Modal";
import { logoutAction } from "@/app/authActions";
import { rotateDecryptionKeyAction } from "@/app/workspaceActions";

interface SettingsPanelProps {
  workspace: WorkspaceInfo;
  userEmail: string;
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium">{label}</label>
      <div className="flex items-start gap-2">
        <code className="max-h-32 min-w-0 flex-1 overflow-y-auto rounded border bg-muted p-2 text-xs break-all">
          {value}
        </code>
        <Button variant="outline" size="icon-sm" onClick={handleCopy}>
          {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
        </Button>
      </div>
    </div>
  );
}

export const SettingsPanel: React.FC<SettingsPanelProps> = ({
  workspace,
  userEmail,
}) => {
  const [isRotating, setIsRotating] = useState(false);
  const [newDecryptionKey, setNewDecryptionKey] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleRotate = async () => {
    if (
      !confirm(
        "Regenerate your workspace decryption key? You must update all apps using the old key.",
      )
    ) {
      return;
    }

    setError("");
    setIsRotating(true);
    const result = await rotateDecryptionKeyAction();
    setIsRotating(false);

    if (!result.success) {
      setError(result.error ?? "Failed to rotate key");
      return;
    }

    if (result.decryptionKey) {
      setNewDecryptionKey(result.decryptionKey);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mb-6">
        <h1 className="text-xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-0.5 text-sm text-muted-foreground">
          Workspace and account settings
        </p>
      </div>

      <div className="max-w-xl space-y-6">
        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Account</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Email</dt>
              <dd>{userEmail}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Workspace</dt>
              <dd>{workspace.name}</dd>
            </div>
          </dl>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => void logoutAction()}
          >
            Sign out
          </Button>
        </section>

        <section className="rounded-lg border p-4">
          <h2 className="font-medium">Workspace decryption key</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Authenticates API requests and decrypts env values in client apps.
            Current key prefix: <code>{workspace.decryptionKeyPrefix}…</code>
          </p>
          {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
          <Button
            variant="outline"
            className="mt-4"
            onClick={handleRotate}
            disabled={isRotating}
          >
            <RefreshCw className="mr-2 size-4" />
            {isRotating ? "Regenerating…" : "Regenerate decryption key"}
          </Button>
        </section>
      </div>

      <Modal
        isOpen={!!newDecryptionKey}
        onClose={() => setNewDecryptionKey(null)}
        title="New decryption key"
        className="max-w-lg"
      >
        {newDecryptionKey && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Copy your new decryption key now. Update it in all apps that use
              EnvVault. The old key will no longer work.
            </p>
            <CopyField label="Decryption key" value={newDecryptionKey} />
            <Button className="w-full" onClick={() => setNewDecryptionKey(null)}>
              Done
            </Button>
          </div>
        )}
      </Modal>
    </div>
  );
};

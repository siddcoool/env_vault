"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/AuthField";
import { registerAction } from "@/app/authActions";
import {
  validateRegisterInput,
  type AuthFieldErrors,
} from "@/lib/auth-validation";

export default function RegisterPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [decryptionKey, setDecryptionKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");
    const name = String(formData.get("name") || "").trim();

    const clientErrors = validateRegisterInput({ email, password, name });
    if (clientErrors) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);

    const result = await registerAction(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? { form: result.error });
      return;
    }

    if (result.decryptionKey) {
      setDecryptionKey(result.decryptionKey);
    }
  };

  const handleCopy = async () => {
    if (!decryptionKey) return;
    await navigator.clipboard.writeText(decryptionKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleContinue = () => {
    router.push("/");
    router.refresh();
  };

  if (decryptionKey) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-lg rounded-xl border bg-card p-8 shadow-sm">
          <h1 className="text-2xl font-bold">Save your decryption key</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This key authenticates API requests and decrypts env values in your apps.
            It will not be shown again — store it securely.
          </p>

          <div className="mt-6">
            <label className="mb-1.5 block text-sm font-medium">
              Workspace decryption key
            </label>
            <div className="flex items-start gap-2">
              <code className="max-h-32 min-w-0 flex-1 overflow-y-auto rounded border bg-muted p-3 text-xs break-all">
                {decryptionKey}
              </code>
              <Button variant="outline" size="icon-sm" onClick={handleCopy}>
                {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
              </Button>
            </div>
          </div>

          <Button className="mt-6 w-full" onClick={handleContinue}>
            Continue to dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
        <div className="mb-8 flex items-center gap-2">
          <Database className="size-6 text-primary" />
          <span className="text-xl font-semibold">EnvVault</span>
        </div>

        <h1 className="text-2xl font-bold">Create account</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your workspace will be created automatically
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
          <AuthField
            label="Name"
            name="name"
            type="text"
            autoComplete="name"
            error={fieldErrors.name}
          />
          <AuthField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            error={fieldErrors.email}
            required
          />
          <AuthField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            error={fieldErrors.password}
            minLength={8}
            required
          />
          <p className="text-xs text-muted-foreground">
            Use at least 8 characters.
          </p>
          {fieldErrors.form && (
            <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {fieldErrors.form}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

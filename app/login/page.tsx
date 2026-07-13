"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/AuthField";
import { LegacyLoginModal } from "@/components/auth/LegacyLoginModal";
import { loginAction } from "@/app/authActions";
import {
  validateLoginInput,
  type AuthFieldErrors,
} from "@/lib/auth-validation";

export default function LoginPage() {
  const router = useRouter();
  const [fieldErrors, setFieldErrors] = useState<AuthFieldErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLegacyModalOpen, setIsLegacyModalOpen] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFieldErrors({});

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    const clientErrors = validateLoginInput({ email, password });
    if (clientErrors) {
      setFieldErrors(clientErrors);
      return;
    }

    setIsSubmitting(true);

    const result = await loginAction(formData);

    if (!result.success) {
      setFieldErrors(result.fieldErrors ?? { form: result.error });
      setIsSubmitting(false);
      return;
    }

    router.refresh();
  };

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-background p-4">
        <div className="w-full max-w-md rounded-xl border bg-card p-8 shadow-sm">
          <div className="mb-8 flex items-center gap-2">
            <Database className="size-6 text-primary" />
            <span className="text-xl font-semibold">EnvVault</span>
          </div>

          <h1 className="text-2xl font-bold">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Access your workspace vault
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
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
              autoComplete="current-password"
              error={fieldErrors.password}
              required
            />
            {fieldErrors.form && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                {fieldErrors.form}
              </p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            No account?{" "}
            <Link href="/register" className="text-primary hover:underline">
              Create one
            </Link>
            {" · "}
            <Link href="/docs" className="text-primary hover:underline">
              Docs
            </Link>
          </p>

          <div className="mt-6 border-t pt-5">
            <p className="mb-3 text-center text-xs text-muted-foreground">
              Previously used a passcode-based vault?
            </p>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => setIsLegacyModalOpen(true)}
            >
              Legacy access
            </Button>
          </div>
        </div>
      </div>

      {isLegacyModalOpen && (
        <LegacyLoginModal onClose={() => setIsLegacyModalOpen(false)} />
      )}
    </>
  );
}

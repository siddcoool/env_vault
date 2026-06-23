"use client";

import React, { useState } from "react";
import { KeyRound, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AuthField } from "@/components/auth/AuthField";
import { legacyLoginAction } from "@/app/authActions";

interface LegacyLoginModalProps {
  onClose: () => void;
}

export function LegacyLoginModal({ onClose }: LegacyLoginModalProps) {
  const router = useRouter();
  const [error, setError] = useState<string | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    try {
      e.preventDefault();
    setError(undefined);

    const formData = new FormData(e.currentTarget);
    const passcode = String(formData.get("passcode") || "");

    if (!passcode) {
      setError("Passcode is required");
      return;
    }

    setIsSubmitting(true);
    const result = await legacyLoginAction(formData);
    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error ?? "Invalid passcode");
      return;
    }

    router.push("/legacy");
    } catch (error) {
      console.error(error);
      setError("Invalid passcode");
      setIsSubmitting(false);
      return;
    }
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={handleBackdropClick}
    >
      <div className="w-full max-w-sm rounded-xl border bg-background p-6 shadow-lg">
        <div className="mb-1 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-muted-foreground" />
            <h2 className="text-base font-semibold">Legacy Access</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <p className="mb-5 text-sm text-muted-foreground">
          Enter your legacy passcode to access projects from the previous system.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <AuthField
            label="Passcode"
            name="passcode"
            type="password"
            autoComplete="current-password"
            error={error}
          />
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Verifying…" : "Access legacy projects"}
          </Button>
        </form>

        <p className="mt-4 text-xs text-muted-foreground">
          Legacy projects are read-only. Run the migration script to move them
          to a workspace account.
        </p>
      </div>
    </div>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import { verifyPasscodeAction } from "./passcodeActions";
import { Eye, EyeOff } from "lucide-react";

const SESSION_KEY = "envvault_passcode_ok";

interface AppGateProps {
  children: React.ReactNode;
}

export const AppGate: React.FC<AppGateProps> = ({ children }) => {
  const [unlocked, setUnlocked] = useState(false);
  const [checking, setChecking] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPasscode, setShowPasscode] = useState(false);

  useEffect(() => {
    const inSession =
      typeof window !== "undefined" && sessionStorage.getItem(SESSION_KEY) === "1";
    if (inSession) {
      setUnlocked(true);
    }
    setChecking(false);
  }, []);

  const handleSubmit = async (formData: FormData) => {
    setSubmitting(true);
    setError(null);
    try {
      const ok = await verifyPasscodeAction(formData);
      if (ok) {
        if (typeof window !== "undefined") {
          sessionStorage.setItem(SESSION_KEY, "1");
        }
        setUnlocked(true);
      } else {
        setError("Incorrect passcode. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-sm text-slate-400">Preparing EnvVault…</div>
      </div>
    );
  }

  if (unlocked) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/80 p-6 shadow-xl">
        <h1 className="text-lg font-semibold text-slate-50 mb-1">Enter passcode</h1>
        <p className="text-xs text-slate-400 mb-4">
          This workspace is protected. Enter the secret passcode to continue.
        </p>
        <form action={handleSubmit} className="space-y-4">
          <div>
            <label
              className="block text-xs font-medium text-slate-300 mb-1"
              htmlFor="passcode"
            >
              Passcode
            </label>
            <div className="relative">
              <input
                id="passcode"
                name="passcode"
                type={showPasscode ? "text" : "password"}
                className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 pr-9 text-sm text-slate-100 outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                autoComplete="off"
                autoFocus
                required
              />
              <button
                type="button"
                onClick={() => setShowPasscode((prev) => !prev)}
                className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-500 hover:text-slate-200"
                aria-label={showPasscode ? "Hide passcode" : "Show passcode"}
              >
                {showPasscode ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {error && <p className="text-xs text-red-400">{error}</p>}

          <button
            type="submit"
            disabled={submitting}
            className="w-full inline-flex items-center justify-center rounded-lg bg-primary-600 hover:bg-primary-500 text-sm font-medium text-white py-2.5 transition-colors disabled:opacity-60"
          >
            {submitting ? "Verifying…" : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
};


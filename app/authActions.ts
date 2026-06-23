"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginUser, logoutUser, registerUser } from "@/lib/auth";
import {
  getPrimaryAuthError,
  validateLoginInput,
  validateRegisterInput,
  type AuthFieldErrors,
} from "@/lib/auth-validation";

export interface AuthActionResult {
  success: boolean;
  error?: string;
  fieldErrors?: AuthFieldErrors;
  decryptionKey?: string;
}

function authFailure(fieldErrors: AuthFieldErrors): AuthActionResult {
  return {
    success: false,
    fieldErrors,
    error: getPrimaryAuthError(fieldErrors),
  };
}

export async function registerAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  const validationErrors = validateRegisterInput({ email, password, name });
  if (validationErrors) {
    return authFailure(validationErrors);
  }

  try {
    const result = await registerUser({
      email: email.trim(),
      password,
      name: name || undefined,
    });
    revalidatePath("/");
    return { success: true, decryptionKey: result.decryptionKey };
  } catch (error) {
    if (error instanceof Error && error.message === "Email already registered") {
      return authFailure({
        email: "An account with this email already exists",
      });
    }

    return authFailure({
      form: error instanceof Error ? error.message : "Registration failed",
    });
  }
}

export async function loginAction(formData: FormData): Promise<AuthActionResult> {
  const email = String(formData.get("email") || "");
  const password = String(formData.get("password") || "");

  const validationErrors = validateLoginInput({ email, password });
  if (validationErrors) {
    return authFailure(validationErrors);
  }

  try {
    await loginUser({ email: email.trim(), password });
  } catch (error) {
    if (error instanceof Error && error.message === "Invalid email or password") {
      return authFailure({ form: error.message });
    }

    return authFailure({
      form: error instanceof Error ? error.message : "Login failed",
    });
  }

  revalidatePath("/");
  redirect("/");
}

export async function logoutAction(): Promise<void> {
  await logoutUser();
  revalidatePath("/");
  redirect("/login");
}

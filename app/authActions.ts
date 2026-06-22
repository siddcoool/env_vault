"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { loginUser, logoutUser, registerUser } from "@/lib/auth";

export async function registerAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
  decryptionKey?: string;
}> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");
  const name = String(formData.get("name") || "").trim();

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  if (password.length < 8) {
    return { success: false, error: "Password must be at least 8 characters" };
  }

  try {
    const result = await registerUser({ email, password, name: name || undefined });
    revalidatePath("/");
    return { success: true, decryptionKey: result.decryptionKey };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Registration failed",
    };
  }
}

export async function loginAction(formData: FormData): Promise<{
  success: boolean;
  error?: string;
}> {
  const email = String(formData.get("email") || "").trim();
  const password = String(formData.get("password") || "");

  if (!email || !password) {
    return { success: false, error: "Email and password are required" };
  }

  try {
    await loginUser({ email, password });
    revalidatePath("/");
    redirect("/");
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Login failed",
    };
  }
}

export async function logoutAction(): Promise<void> {
  await logoutUser();
  revalidatePath("/");
  redirect("/login");
}

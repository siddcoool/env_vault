"use server";

import { revalidatePath } from "next/cache";
import { encrypt, decrypt } from "../lib/crypto";
import { connectDb } from "../lib/mongoose";
import { PasscodeModel } from "../models/Passcode";

export async function verifyPasscodeAction(formData: FormData): Promise<boolean> {
  const input = String(formData.get("passcode") || "");
  if (!input) return false;

  await connectDb();
  const existing = await PasscodeModel.findOne({});
  if (!existing) {
    // First-time setup: create the single passcode document.
    const now = new Date().toISOString();
    const enc = encrypt(input);

    // Ensure only one passcode document exists.
    await PasscodeModel.deleteMany({});
    await PasscodeModel.create({
      valueEnc: enc,
      createdAt: now,
      updatedAt: now,
    });

    return true;
  }

  try {
    const stored = decrypt(existing.valueEnc);
    return stored === input;
  } catch {
    return false;
  }
}

// Optional helper to update the passcode; call manually/admin-only.
export async function setPasscodeAction(formData: FormData): Promise<void> {
  const input = String(formData.get("passcode") || "");
  if (!input) return;

  await connectDb();
  const now = new Date().toISOString();
  const enc = encrypt(input);

  await PasscodeModel.updateOne(
    {},
    { valueEnc: enc, createdAt: now, updatedAt: now },
    { upsert: true },
  );

  revalidatePath("/");
}



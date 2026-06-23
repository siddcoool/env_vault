import bcrypt from "bcryptjs";
import { Types } from "mongoose";
import { connectDb } from "./mongoose";
import { getSession } from "./session";
import { UserModel } from "../models/User";
import { WorkspaceModel } from "../models/Workspace";
import {
  generateDecryptionKey,
  getDecryptionKeyPrefix,
  hashDecryptionKey,
} from "./workspace-key-utils";
import { decrypt, encrypt } from "./crypto";

const SALT_ROUNDS = 12;

export interface AuthUser {
  userId: string;
  workspaceId: string;
  email: string;
  name?: string;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(
  password: string,
  passwordHash: string,
): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

export async function requireUser(): Promise<AuthUser> {
  const session = await getSession();

  if (!session.isLoggedIn || !session.userId || !session.workspaceId || !session.email) {
    throw new Error("Unauthorized");
  }

  return {
    userId: session.userId,
    workspaceId: session.workspaceId,
    email: session.email,
  };
}

export async function getWorkspaceDecryptionKeyPlain(
  workspaceId: string,
): Promise<string> {
  await connectDb();
  const workspace = await WorkspaceModel.findById(workspaceId).lean<{
    decryptionKeyEnc: { iv: string; authTag: string; ciphertext: string };
  }>();

  if (!workspace) {
    throw new Error("Workspace not found");
  }

  return decrypt(workspace.decryptionKeyEnc);
}

export async function registerUser(params: {
  email: string;
  password: string;
  name?: string;
}): Promise<{ user: AuthUser; decryptionKey: string }> {
  await connectDb();

  const email = params.email.trim().toLowerCase();
  const existing = await UserModel.findOne({ email }).lean();
  if (existing) {
    throw new Error("Email already registered");
  }

  const decryptionKey = generateDecryptionKey();
  const now = new Date().toISOString();
  const workspaceName = params.name?.trim() || email.split("@")[0] || "My Workspace";

  const workspace = await WorkspaceModel.create({
    name: workspaceName,
    decryptionKeyHash: hashDecryptionKey(decryptionKey),
    decryptionKeyEnc: encrypt(decryptionKey),
    decryptionKeyPrefix: getDecryptionKeyPrefix(decryptionKey),
    createdAt: now,
  });

  const user = await UserModel.create({
    email,
    passwordHash: await hashPassword(params.password),
    name: params.name?.trim(),
    workspaceId: workspace._id,
    createdAt: now,
  });

  const session = await getSession();
  session.userId = user._id.toString();
  session.workspaceId = workspace._id.toString();
  session.email = email;
  session.isLoggedIn = true;
  await session.save();

  return {
    user: {
      userId: user._id.toString(),
      workspaceId: workspace._id.toString(),
      email,
      name: params.name?.trim(),
    },
    decryptionKey,
  };
}

export async function loginUser(params: {
  email: string;
  password: string;
}): Promise<AuthUser> {
  await connectDb();

  const email = params.email.trim().toLowerCase();
  const user = await UserModel.findOne({ email }).lean<{
    _id: Types.ObjectId;
    passwordHash: string;
    workspaceId: Types.ObjectId;
    name?: string;
  }>();

  if (!user) {
    throw new Error("Invalid email or password");
  }

  const valid = await verifyPassword(params.password, user.passwordHash);
  if (!valid) {
    throw new Error("Invalid email or password");
  }

  const session = await getSession();
  session.userId = user._id.toString();
  session.workspaceId = user.workspaceId.toString();
  session.email = email;
  session.isLoggedIn = true;
  await session.save();

  return {
    userId: user._id.toString(),
    workspaceId: user.workspaceId.toString(),
    email,
    name: user.name,
  };
}

export async function logoutUser(): Promise<void> {
  const session = await getSession();
  session.destroy();
}

export async function rotateWorkspaceDecryptionKey(
  workspaceId: string,
): Promise<string> {
  await connectDb();

  const decryptionKey = generateDecryptionKey();
  await WorkspaceModel.updateOne(
    { _id: new Types.ObjectId(workspaceId) },
    {
      $set: {
        decryptionKeyHash: hashDecryptionKey(decryptionKey),
        decryptionKeyEnc: encrypt(decryptionKey),
        decryptionKeyPrefix: getDecryptionKeyPrefix(decryptionKey),
      },
    },
  );

  const { reencryptAllFilesForWorkspace } = await import("./workspace-reencrypt");
  await reencryptAllFilesForWorkspace(workspaceId, decryptionKey);

  return decryptionKey;
}

import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error("MONGODB_URI environment variable is not set");
}

let isConnected = false;

export async function connectDb() {
  if (isConnected) return;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  await mongoose.connect(MONGODB_URI, {
    dbName: process.env.MONGODB_DB || "envvault",
  });

  isConnected = true;
}

export { mongoose };



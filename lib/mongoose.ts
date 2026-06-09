import mongoose from "mongoose";

let isConnected = false;

export async function connectDb() {
  if (isConnected) return;

  const mongodbUri = process.env.MONGODB_URI;
  if (!mongodbUri) {
    throw new Error("MONGODB_URI environment variable is not set");
  }

  await mongoose.connect(mongodbUri, {
    dbName: process.env.MONGODB_DB || "envvault",
  });

  isConnected = true;
}

export { mongoose };



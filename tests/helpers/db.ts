import { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { connectDB } from "@/db/connection";

// One ephemeral replica set per file (transactions-capable).
export async function startMemoryDB() {
  const replSet = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  await connectDB(replSet.getUri());
  return replSet;
}

export async function stopMemoryDB(replSet: MongoMemoryReplSet | undefined) {
  await mongoose.disconnect();
  globalThis.__mongooseCache = undefined;
  if (replSet) await replSet.stop();
}

export async function clearDB() {
  const db = mongoose.connection.db;
  if (!db) return;
  for (const c of await db.collections()) await c.deleteMany({});
}

import "server-only";
import mongoose from "mongoose";
import { getEnv } from "@/lib/env";

// Single cached connection for serverless (avoids exhausting the 500-connection free limit).
declare global {
  var __mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

export async function connectDB(uri?: string) {
  const cached = (globalThis.__mongooseCache ??= { conn: null, promise: null });
  if (cached.conn) return cached.conn;
  if (!cached.promise) {
    const env = getEnv();
    const mongoUri = uri ?? env.mongoUri;
    if (!mongoUri) {
      throw new Error("Missing MongoDB URI (tests must pass an in-memory URI)");
    }
    // autoIndex builds indexes in dev/test; production uses ensure-indexes script.
    cached.promise = mongoose.connect(mongoUri, {
      autoIndex: env.nodeEnv !== "production",
    });
    // A failed connect must not poison the cache until restart.
    cached.promise.catch(() => {
      if (globalThis.__mongooseCache) globalThis.__mongooseCache.promise = null;
    });
  }
  cached.conn = await cached.promise;
  return cached.conn;
}

import { beforeAll, afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import mongoose from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { connectDB } from "@/db/connection";
import { __resetEnvCache } from "@/lib/env";
import { User } from "@/db/models/User";
import { getSessionContext } from "../services/session-context";

let replSet: MongoMemoryReplSet;
let uri: string;

beforeAll(async () => {
  replSet = await startMemoryDB();
  uri = replSet.getUri();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

describe("cold start", () => {
  it("getSessionContext opens a connection instead of buffering", async () => {
    const u = await User.create({ name: "U", email: "cold@example.com", emailVerifiedAt: new Date() });
    const uid = String(u._id);
    // Simulate a cold start: drop the connection and the cached promise.
    await mongoose.disconnect();
    globalThis.__mongooseCache = undefined;
    expect(mongoose.connection.readyState).toBe(0);
    // Simulate production env where the URI comes from env, not an argument.
    vi.stubEnv("NODE_ENV", "development");
    vi.stubEnv("MONGODB_URI_DEV", uri);
    __resetEnvCache();
    try {
      const ctx = await getSessionContext(uid, null, 0);
      expect(ctx.kind).toBe("onboarding");
      expect(mongoose.connection.readyState).toBe(1);
    } finally {
      vi.unstubAllEnvs();
      __resetEnvCache();
      globalThis.__mongooseCache = undefined;
      await connectDB(uri);
    }
  });
});

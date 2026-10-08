import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { getSessionContext } from "../services/session-context";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

describe("session version check", () => {
  it("accepts matching version, rejects stale one", async () => {
    const u = await User.create({ name: "U", email: "sv@example.com", emailVerifiedAt: new Date() });
    const ctx = await getSessionContext(String(u._id), null, 0);
    expect(ctx.kind).toBe("onboarding");
    await User.updateOne({ _id: u._id }, { $inc: { sessionVersion: 1 } });
    await expect(getSessionContext(String(u._id), null, 0)).rejects.toThrow("UNAUTHENTICATED");
    const ctx2 = await getSessionContext(String(u._id), null, 1);
    expect(ctx2.kind).toBe("onboarding");
  });

  it("unverified email returns unverified kind", async () => {
    const u = await User.create({ name: "U", email: "uv@example.com" });
    const ctx = await getSessionContext(String(u._id), null, 0);
    expect(ctx.kind).toBe("unverified");
  });
});

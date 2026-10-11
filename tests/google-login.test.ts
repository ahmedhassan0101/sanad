// دخول Google بلا Adapter: userId الناتج يجب أن يكون Mongo _id لا UUID.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import {
  ensureGoogleUser,
  registerAccount,
  resolveGoogleTokenUser,
} from "../services/auth-accounts";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

describe("google login identity", () => {
  it("new google user resolves to a valid ObjectId matching the DB user", async () => {
    expect(await ensureGoogleUser({ email: "G@Example.com", name: "G" })).toBe(true);
    const resolved = await resolveGoogleTokenUser("g@example.com");
    expect(resolved).not.toBeNull();
    expect(Types.ObjectId.isValid(resolved!.id)).toBe(true);
    const dbUser = await User.findOne({ email: "g@example.com" });
    expect(resolved!.id).toBe(String(dbUser!._id));
    expect(resolved!.sessionVersion).toBe(0);
  });

  it("returning google user maps to the same _id", async () => {
    await ensureGoogleUser({ email: "back@example.com", name: "B" });
    const first = await resolveGoogleTokenUser("back@example.com");
    await ensureGoogleUser({ email: "back@example.com", name: "B2" });
    const second = await resolveGoogleTokenUser("back@example.com");
    expect(second!.id).toBe(first!.id);
    expect(await User.countDocuments({ email: "back@example.com" })).toBe(1);
  });

  it("email/password user later using google maps to the same _id", async () => {
    await registerAccount("PW", "pw@example.com", "password123");
    const before = await User.findOne({ email: "pw@example.com" }).select("+passwordHash");
    expect(before?.passwordHash).toBeTruthy();
    expect(await ensureGoogleUser({ email: "pw@example.com", name: "PW" })).toBe(true);
    const resolved = await resolveGoogleTokenUser("pw@example.com");
    expect(resolved!.id).toBe(String(before!._id));
    const after = await User.findOne({ email: "pw@example.com" }).select("+passwordHash");
    expect(after?.passwordHash).toBeNull();
  });
});

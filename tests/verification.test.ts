import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { VerificationToken } from "@/db/models/VerificationToken";
import { registerAccount, ensureGoogleUser } from "../services/auth-accounts";
import { createCenter } from "../services/orgs";
import { createInvite, consumeInvite } from "../services/invites";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

describe("email verification enforcement", () => {
  it("unverified user rejected from createCenter and consumeInvite", async () => {
    await registerAccount("UU", "u@v.test", "password123");
    const u = await User.findOne({ email: "u@v.test" });
    await expect(
      createCenter(String(u!._id), { name: "X", contactPhone: "01000000000", programs: ["quran"] })
    ).rejects.toThrow();
    await expect(consumeInvite(String(u!._id), "ABCDEFGH")).rejects.toThrow("UNVERIFIED");
  });

  it("re-registering unverified email replaces password instead of TAKEN", async () => {
    await registerAccount("UU", "r@v.test", "password123");
    await registerAccount("New Name", "r@v.test", "password456");
    const u = await User.findOne({ email: "r@v.test" });
    expect(u?.name).toBe("New Name");
    expect(await VerificationToken.countDocuments({ identifier: "r@v.test" })).toBe(1);
  });

  it("verified email keeps TAKEN", async () => {
    await registerAccount("UU", "t2@v.test", "password123");
    await User.updateOne({ email: "t2@v.test" }, { $set: { emailVerifiedAt: new Date() } });
    await expect(registerAccount("U2", "t2@v.test", "password456")).rejects.toThrow("TAKEN");
  });

  it("google activation clears pre-set password and bumps session", async () => {
    await registerAccount("UU", "g@v.test", "password123");
    const before = await User.findOne({ email: "g@v.test" }).select("+passwordHash");
    expect(before?.passwordHash).toBeTruthy();
    expect(await ensureGoogleUser({ email: "g@v.test", name: "U" })).toBe(true);
    const after = await User.findOne({ email: "g@v.test" }).select("+passwordHash");
    expect(after?.passwordHash).toBeNull();
    expect(after?.sessionVersion).toBe(1);
    expect(after?.emailVerifiedAt).toBeTruthy();
  });

  it("verified owner can create center and invite, newcomer consumes after verifying", async () => {
    await registerAccount("OO", "o2@v.test", "password123");
    await User.updateOne({ email: "o2@v.test" }, { $set: { emailVerifiedAt: new Date() } });
    const o = await User.findOne({ email: "o2@v.test" });
    const { orgId } = await createCenter(String(o!._id), {
      name: "CC",
      contactPhone: "01000000000",
      programs: ["quran"],
    });
    const { Branch } = await import("@/db/models/Branch");
    const br = await Branch.findOne({ orgId });
    const { code } = await createInvite(
      { userId: String(o!._id), orgId: new Types.ObjectId(orgId), role: "center_admin", branchIds: [] },
      "supervisor",
      String(br!._id),
      2
    );
    await registerAccount("NN", "n@v.test", "password123");
    const n = await User.findOne({ email: "n@v.test" });
    await expect(consumeInvite(String(n!._id), code)).rejects.toThrow("UNVERIFIED");
    await User.updateOne({ email: "n@v.test" }, { $set: { emailVerifiedAt: new Date() } });
    const joined = await consumeInvite(String(n!._id), code);
    expect(joined.orgId).toBe(orgId);
  });
});

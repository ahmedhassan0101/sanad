import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { OrgProgram } from "@/db/models/OrgProgram";
import { Invite } from "@/db/models/Invite";
import { hashInviteCode } from "@/lib/invite-code";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
  // Ensure unique indexes exist before asserting on them (autoIndex builds in background).
  await Promise.all([
    User.createIndexes(),
    Org.createIndexes(),
    Branch.createIndexes(),
    Membership.createIndexes(),
    OrgProgram.createIndexes(),
    Invite.createIndexes(),
  ]);
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

describe("unique constraints", () => {
  it("rejects duplicate user email (case-insensitive)", async () => {
    await User.create({ name: "A", email: "Same@Example.com" });
    await expect(User.create({ name: "B", email: "same@example.com" })).rejects.toThrow();
  });

  it("rejects duplicate membership for same user+org", async () => {
    const u = await User.create({ name: "U", email: "u@example.com" });
    const org = await Org.create({
      name: "O",
      contactPhone: "01",
      createdByUserId: u._id,
    });
    await Membership.create({ userId: u._id, orgId: org._id, role: "center_admin" });
    await expect(
      Membership.create({ userId: u._id, orgId: org._id, role: "center_admin" })
    ).rejects.toThrow();
  });

  it("rejects duplicate branch name inside one org, allows across orgs", async () => {
    const u = await User.create({ name: "U", email: "u2@example.com" });
    const mk = (n: string) => Org.create({ name: n, contactPhone: "01", createdByUserId: u._id });
    const a = await mk("A");
    const b = await mk("B");
    await Branch.create({ orgId: a._id, name: "Main" });
    await expect(Branch.create({ orgId: a._id, name: "Main" })).rejects.toThrow();
    await Branch.create({ orgId: b._id, name: "Main" });
  });

  it("rejects duplicate program key inside one org", async () => {
    const u = await User.create({ name: "U", email: "u3@example.com" });
    const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: u._id });
    await OrgProgram.create({ orgId: org._id, programKey: "quran" });
    await expect(OrgProgram.create({ orgId: org._id, programKey: "quran" })).rejects.toThrow();
    await OrgProgram.create({ orgId: org._id, programKey: "custom:sports-club" });
  });

  it("rejects duplicate invite codeHash", async () => {
    const u = await User.create({ name: "U", email: "u4@example.com" });
    const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: u._id });
    const mk = (h: string) =>
      Invite.create({
        orgId: org._id,
        branchId: null,
        role: "center_admin",
        codeHash: h,
        expiresAt: new Date(Date.now() + 3600_000),
        purgeAt: new Date(Date.now() + 31 * 86400_000),
        createdByUserId: u._id,
      });
    const h = hashInviteCode("ABCDEFGH", "test-pepper");
    await mk(h);
    await expect(mk(h)).rejects.toThrow();
  });
});

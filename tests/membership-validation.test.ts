import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

describe("membership branch validation", () => {
  it("branch_admin and teacher require at least one branch", async () => {
    const u = await User.create({ name: "U", email: "m@example.com" });
    const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: u._id });
    await expect(
      Membership.create({ userId: u._id, orgId: org._id, role: "branch_admin", branchIds: [] })
    ).rejects.toThrow(/at least one branch/);
    await expect(
      Membership.create({ userId: u._id, orgId: org._id, role: "teacher", branchIds: [] })
    ).rejects.toThrow(/at least one branch/);
  });

  it("owner works without branchIds, scoped roles work with one", async () => {
    const ownerUser = await User.create({ name: "Owner", email: "m2-owner@example.com" });
    const teacherUser = await User.create({ name: "Teacher", email: "m2-teacher@example.com" });
    const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: ownerUser._id });
    const br = await Branch.create({ orgId: org._id, name: "Main" });
    const owner = await Membership.create({
      userId: ownerUser._id,
      orgId: org._id,
      role: "center_admin",
    });
    expect(owner.branchIds).toHaveLength(0);
    const t = await Membership.create({
      userId: teacherUser._id,
      orgId: org._id,
      role: "teacher",
      branchIds: [br._id],
    });
    expect(t.branchIds).toHaveLength(1);
  });
});

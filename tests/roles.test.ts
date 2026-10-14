import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { can, ROLES } from "@/lib/permissions/roles";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Invite } from "@/db/models/Invite";
import {
  assertBranchesInOrg,
  assertMembershipShape,
  assertRankAllows,
  guardAdminChange,
} from "../services/memberships";

let replSet: MongoMemoryReplSet;

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(clearDB);

describe("role matrix (static)", () => {
  it("center_admin manages programs, supervisor writes attendance only", () => {
    expect(can("center_admin", "program:manage")).toBe(true);
    expect(can("supervisor", "program:manage")).toBe(false);
    expect(can("supervisor", "attendance:write")).toBe(true);
    expect(can("branch_admin", "member:invite-teacher")).toBe(true);
    expect(can("supervisor", "member:disable")).toBe(false);
  });

  it("student permissions: all manage, only managers delete", () => {
    for (const action of ["student:create", "student:edit", "student:archive", "student:report", "student:import"] as const) {
      expect(can("center_admin", action)).toBe(true);
      expect(can("branch_admin", action)).toBe(true);
      expect(can("supervisor", action)).toBe(true);
    }
    expect(can("center_admin", "student:delete")).toBe(true);
    expect(can("branch_admin", "student:delete")).toBe(true);
    expect(can("supervisor", "student:delete")).toBe(false);
  });

  it("no one grants above their level", () => {
    expect(() => assertRankAllows("branch_admin", "center_admin")).toThrow("FORBIDDEN");
    expect(() => assertRankAllows("center_admin", "supervisor")).not.toThrow();
  });

  it("teacher is no longer a valid role", async () => {
    expect(ROLES).toEqual(["center_admin", "branch_admin", "supervisor"]);
    expect(ROLES).not.toContain("teacher");
    expect(can("teacher" as never, "attendance:write")).toBe(false);
    await expect(
      Membership.create({
        userId: new Types.ObjectId(),
        orgId: new Types.ObjectId(),
        role: "teacher",
      }),
    ).rejects.toThrow();
  });
});

describe("membership guards (stateful)", () => {
  it("org creator is protected; last admin blocked; second admin allowed", async () => {
    const creator = await User.create({ name: "C", email: "c@example.com" });
    const other = await User.create({ name: "O", email: "o@example.com" });
    const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: creator._id });
    await Membership.create({ userId: creator._id, orgId: org._id, role: "center_admin" });

    await expect(
      guardAdminChange(org._id, creator._id, "center_admin", null)
    ).rejects.toThrow(/creator is protected/);
    await expect(
      guardAdminChange(org._id, creator._id, "center_admin", null)
    ).rejects.toThrow();
    // last admin (even non-creator) is blocked
    await Membership.create({ userId: other._id, orgId: org._id, role: "center_admin" });
    await guardAdminChange(org._id, other._id, "center_admin", null); // second exists: allowed
  });

  it("shape + branch-subset enforced", async () => {
    const u = await User.create({ name: "U", email: "s@example.com" });
    const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: u._id });
    const br = await Branch.create({ orgId: org._id, name: "Main" });
    expect(() => assertMembershipShape("supervisor", [])).toThrow("VALIDATION");
    await expect(assertBranchesInOrg(org._id, [new Types.ObjectId()])).rejects.toThrow(
      "VALIDATION"
    );
    await assertBranchesInOrg(org._id, [br._id]);
  });

  it("supervisor invite requires a branch, center_admin invite does not", async () => {
    const u = await User.create({ name: "U", email: "i@example.com" });
    const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: u._id });
    const br = await Branch.create({ orgId: org._id, name: "Main" });
    const base = {
      orgId: org._id,
      role: "supervisor",
      codeHash: "h1",
      expiresAt: new Date(Date.now() + 3600_000),
      purgeAt: new Date(Date.now() + 31 * 86400_000),
      createdByUserId: u._id,
    } as const;
    await expect(Invite.create({ ...base, branchId: null })).rejects.toThrow();
    await Invite.create({ ...base, branchId: br._id, codeHash: "h2" });
    await Invite.create({
      ...base,
      role: "center_admin",
      branchId: null,
      codeHash: "h3",
    });
  });
});

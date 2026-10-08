import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { getSessionContext } from "../services/session-context";
import { listBranches } from "../services/branches-read";

let replSet: MongoMemoryReplSet;
let ids: { aAdmin: string; aOrg: string; teacher: string; bOrg: string; b1: string };

async function makeOrg(orgName: string, branchNames: string[], adminEmail: string) {
  const admin = await User.create({ name: `${orgName} admin`, email: adminEmail, emailVerifiedAt: new Date() });
  const org = await Org.create({
    name: orgName,
    contactPhone: "01",
    createdByUserId: admin._id,
  });
  const branches = [];
  for (const n of branchNames) branches.push(await Branch.create({ orgId: org._id, name: n }));
  await Membership.create({ userId: admin._id, orgId: org._id, role: "center_admin" });
  return { admin, org, branches };
}

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(async () => {
  await clearDB();
  const a = await makeOrg("OrgA", ["A1", "A2"], "a@example.com");
  const b = await makeOrg("OrgB", ["B1"], "b@example.com");
  const teacher = await User.create({ name: "T1", email: "t1@example.com", emailVerifiedAt: new Date() });
  await Membership.create({
    userId: teacher._id,
    orgId: a.org._id,
    role: "teacher",
    branchIds: [a.branches[0]!._id],
  });
  ids = {
    aAdmin: String(a.admin._id),
    aOrg: String(a.org._id),
    teacher: String(teacher._id),
    bOrg: String(b.org._id),
    b1: String(b.branches[0]!._id),
  };
});

describe("tenant isolation", () => {
  it("admin of A lists only A branches", async () => {
    const ctx = await getSessionContext(ids.aAdmin, ids.aOrg);
    expect((await listBranches(ctx)).map((b) => b.name).sort()).toEqual(["A1", "A2"]);
  });

  it("teacher of A1 lists only A1", async () => {
    const ctx = await getSessionContext(ids.teacher, ids.aOrg);
    expect((await listBranches(ctx)).map((b) => b.name)).toEqual(["A1"]);
  });

  it("cross-org write by id is denied (lookup always carries orgId)", async () => {
    const res = await Branch.updateOne(
      { _id: new Types.ObjectId(ids.b1), orgId: new Types.ObjectId(ids.aOrg) },
      { $set: { name: "Hacked" } }
    );
    expect(res.matchedCount).toBe(0);
    expect((await Branch.findById(ids.b1))?.name).toBe("B1");
  });

  it("member of A cannot build a context for org B", async () => {
    await expect(getSessionContext(ids.aAdmin, ids.bOrg)).rejects.toThrow("FORBIDDEN");
  });

  it("onboarding user (no org) cannot list branches", async () => {
    const u = await User.create({ name: "New", email: "new@example.com", emailVerifiedAt: new Date() });
    const ctx = await getSessionContext(String(u._id), null);
    expect(ctx.kind).toBe("onboarding");
    await expect(listBranches(ctx)).rejects.toThrow("FORBIDDEN");
  });

  it("unverified user cannot list branches", async () => {
    const u = await User.create({ name: "Unv", email: "unv@example.com" });
    const ctx = await getSessionContext(String(u._id), null);
    expect(ctx.kind).toBe("unverified");
    await expect(listBranches(ctx)).rejects.toThrow("FORBIDDEN");
  });
});

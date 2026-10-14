import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { createInvite, listInvites, revokeInvite } from "../services/invites";
import { listMembers, updateMember } from "../services/members";

let replSet: MongoMemoryReplSet;
let ids: { owner: Types.ObjectId; mgr: Types.ObjectId; tch: Types.ObjectId; org: Types.ObjectId; b1: Types.ObjectId; b2: Types.ObjectId };

function ctx(userId: Types.ObjectId, orgId: Types.ObjectId, role: "center_admin" | "branch_admin" | "supervisor", branchIds: Types.ObjectId[]) {
  return {
    kind: "member" as const,
    userId: String(userId),
    orgId,
    role,
    branchScope: role === "center_admin" ? { mode: "all" as const } : { mode: "list" as const, branchIds },
  };
}

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(async () => {
  await clearDB();
  const verified = new Date();
  const owner = await User.create({ name: "O", email: "o@t.test", emailVerifiedAt: verified });
  const mgr = await User.create({ name: "M", email: "m@t.test", emailVerifiedAt: verified });
  const tch = await User.create({ name: "T", email: "t@t.test", emailVerifiedAt: verified });
  const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: owner._id });
  const b1 = await Branch.create({ orgId: org._id, name: "B1" });
  const b2 = await Branch.create({ orgId: org._id, name: "B2" });
  await Membership.create({ userId: owner._id, orgId: org._id, role: "center_admin" });
  await Membership.create({ userId: mgr._id, orgId: org._id, role: "branch_admin", branchIds: [b1._id] });
  await Membership.create({ userId: tch._id, orgId: org._id, role: "supervisor", branchIds: [b1._id] });
  ids = { owner: owner._id, mgr: mgr._id, tch: tch._id, org: org._id, b1: b1._id, b2: b2._id };
});

describe("team invites", () => {
  it("center creates supervisor invite; branch_admin cannot create center_admin", async () => {
    const c = ctx(ids.owner, ids.org, "center_admin", []);
    const { code } = await createInvite(
      { userId: String(ids.owner), orgId: ids.org, role: "center_admin", branchIds: [] },
      "supervisor",
      String(ids.b1),
      2
    );
    expect(code).toHaveLength(8);
    const m = ctx(ids.mgr, ids.org, "branch_admin", [ids.b1]);
    await expect(
      createInvite(
        { userId: String(ids.mgr), orgId: ids.org, role: "branch_admin", branchIds: [ids.b1] },
        "center_admin",
        null,
        2
      )
    ).rejects.toThrow("FORBIDDEN");
    expect((await listInvites(c)).length).toBe(1);
    expect((await listInvites(m)).length).toBe(1);
  });

  it("supervisor cannot list invites; branch_admin cannot revoke other branch invite", async () => {
    const t = ctx(ids.tch, ids.org, "supervisor", [ids.b1]);
    await expect(listInvites(t)).rejects.toThrow("FORBIDDEN");
    await createInvite(
      { userId: String(ids.owner), orgId: ids.org, role: "center_admin", branchIds: [] },
      "supervisor",
      String(ids.b2),
      2
    );
    const m = ctx(ids.mgr, ids.org, "branch_admin", [ids.b1]);
    const all = await listInvites({ ...m, role: "center_admin", branchScope: { mode: "all" as const } });
    await expect(revokeInvite(m, all[0]!.id)).rejects.toThrow("FORBIDDEN");
  });

  it("invite limit is 20 per branch", async () => {
    const g = { userId: String(ids.owner), orgId: ids.org, role: "center_admin" as const, branchIds: [] as Types.ObjectId[] };
    for (let i = 0; i < 20; i++) {
      await createInvite(g, "supervisor", String(ids.b1), 2);
    }
    await expect(createInvite(g, "supervisor", String(ids.b1), 2)).rejects.toThrow("FORBIDDEN");
  });
});

describe("team members", () => {
  it("supervisor blocked; creator protected; last admin blocked", async () => {
    const t = ctx(ids.tch, ids.org, "supervisor", [ids.b1]);
    await expect(listMembers(t)).rejects.toThrow("FORBIDDEN");
    const c = ctx(ids.owner, ids.org, "center_admin", []);
    const members = await listMembers(c);
    expect(members.length).toBe(3);
    await expect(updateMember(c, String(ids.owner), { status: "disabled" })).rejects.toThrow();
  });
});

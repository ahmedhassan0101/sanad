// الفروع: عزل المراكز، صلاحية المدير فقط، منع أرشفة فرع مشغول.
// Client Component — تفاعل الخلايا واللصق لا يعملان في Server Component.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
import {
  archiveBranch,
  createBranch,
  listBranchesWithCounts,
  renameBranch,
} from "../services/branches";

let replSet: MongoMemoryReplSet;
let ids: { owner: Types.ObjectId; mgr: Types.ObjectId; org: Types.ObjectId; orgB: Types.ObjectId; b1: Types.ObjectId };

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
  const owner = await User.create({ name: "O", email: "o@br.test", emailVerifiedAt: verified });
  const mgr = await User.create({ name: "M", email: "m@br.test", emailVerifiedAt: verified });
  const other = await User.create({ name: "X", email: "x@br.test", emailVerifiedAt: verified });
  const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: owner._id });
  const orgB = await Org.create({ name: "B", contactPhone: "01", createdByUserId: other._id });
  const b1 = await Branch.create({ orgId: org._id, name: "B1" });
  await Membership.create({ userId: owner._id, orgId: org._id, role: "center_admin" });
  await Membership.create({ userId: mgr._id, orgId: org._id, role: "branch_admin", branchIds: [b1._id] });
  await Membership.create({ userId: other._id, orgId: orgB._id, role: "center_admin" });
  ids = { owner: owner._id, mgr: mgr._id, org: org._id, orgB: orgB._id, b1: b1._id };
});

describe("branches", () => {
  it("only center_admin manages; names unique per org", async () => {
    const c = ctx(ids.owner, ids.org, "center_admin", []);
    const { id } = await createBranch(c, "فرع جديد");
    expect(typeof id).toBe("string");
    await expect(createBranch(c, "فرع جديد")).rejects.toThrow("بهذا الاسم");
    const m = ctx(ids.mgr, ids.org, "branch_admin", [ids.b1]);
    await expect(createBranch(m, "فرع")).rejects.toThrow("FORBIDDEN");
    await expect(renameBranch(m, id, "س")).rejects.toThrow("FORBIDDEN");
    await renameBranch(c, id, "فرع معدل");
    const other = ctx(ids.owner, ids.orgB, "center_admin", []);
    await expect(renameBranch(other, id, "فرع أجنبي")).rejects.toThrow("NOT_FOUND");
  });

  it("refuses to archive an occupied branch", async () => {
    const c = ctx(ids.owner, ids.org, "center_admin", []);
    await Student.create({
      orgId: ids.org, branchId: ids.b1, name: "س", nameSearch: "س",
      gender: "male", level: "beginner", guardians: [], parentCode: "X1",
    });
    await expect(archiveBranch(c, String(ids.b1))).rejects.toThrow("انقلهم أولًا");
    const { id } = await createBranch(c, "فارغ");
    await archiveBranch(c, id);
    const rows = await listBranchesWithCounts(c);
    expect(rows.find((r) => r.id === id)?.status).toBe("archived");
  });
});

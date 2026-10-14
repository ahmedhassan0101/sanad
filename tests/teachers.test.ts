// اختبار خدمات المعلمين: العزل، التكرار، الحذف، الصلاحيات، الصورة.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Teacher } from "@/db/models/Teacher";
import {
  archiveTeacher,
  createTeacher,
  deleteTeacherPermanently,
  getTeacher,
  getTeacherStats,
  listTeachers,
  updateTeacher,
} from "../services/teachers";

let replSet: MongoMemoryReplSet;
let ids: { orgA: Types.ObjectId; orgB: Types.ObjectId; a1: Types.ObjectId; a2: Types.ObjectId };

type Ctx = Parameters<typeof listTeachers>[0];

function memberCtx(
  userId: Types.ObjectId,
  orgId: Types.ObjectId,
  role: "center_admin" | "branch_admin" | "supervisor",
  branchIds: Types.ObjectId[],
): Ctx {
  return {
    kind: "member",
    userId: String(userId),
    orgId,
    role,
    branchScope: role === "center_admin" ? { mode: "all" } : { mode: "list", branchIds },
  };
}

const baseInput = {
  name: "الشيخ محمود",
  phone: "01000000001",
  notes: "تحفيظ جزء عم",
};

let users: { adminA: Types.ObjectId; supervisorA: Types.ObjectId };

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(async () => {
  await clearDB();
  const mk = async (name: string, email: string) =>
    User.create({ name, email, emailVerifiedAt: new Date() });
  const adminA = await mk("AdminA", "aa@teach.test");
  const adminB = await mk("AdminB", "ab@teach.test");
  const supervisorA = await mk("SupervisorA", "sa@teach.test");
  const orgA = await Org.create({ name: "A", contactPhone: "01", createdByUserId: adminA._id });
  const orgB = await Org.create({ name: "B", contactPhone: "01", createdByUserId: adminB._id });
  const a1 = await Branch.create({ orgId: orgA._id, name: "A1" });
  const a2 = await Branch.create({ orgId: orgA._id, name: "A2" });
  await Branch.create({ orgId: orgB._id, name: "B1" });
  await Membership.create({ userId: adminA._id, orgId: orgA._id, role: "center_admin" });
  await Membership.create({ userId: adminB._id, orgId: orgB._id, role: "center_admin" });
  await Membership.create({ userId: supervisorA._id, orgId: orgA._id, role: "supervisor", branchIds: [a1._id] });
  users = { adminA: adminA._id, supervisorA: supervisorA._id };
  ids = { orgA: orgA._id, orgB: orgB._id, a1: a1._id, a2: a2._id };
});

describe("teachers isolation", () => {
  it("reads and writes stay inside org and branch scope", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const supervisorA = memberCtx(users.supervisorA, ids.orgA, "supervisor", [ids.a1]);
    const created = await createTeacher(adminA, { ...baseInput, branchId: String(ids.a1) });
    expect(created.status).toBe("created");
    const id = (created as { id: string }).id;
    const otherOrg = memberCtx(users.adminA, ids.orgB, "center_admin", []);
    await expect(getTeacher(otherOrg, id)).rejects.toThrow("NOT_FOUND");
    const inA2 = await createTeacher(adminA, { ...baseInput, name: "الشيخ علي", branchId: String(ids.a2) });
    await expect(getTeacher(supervisorA, (inA2 as { id: string }).id)).rejects.toThrow("NOT_FOUND");
    await expect(
      createTeacher(supervisorA, { ...baseInput, name: "خارج النطاق", branchId: String(ids.a2) }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

describe("teachers duplicate warning", () => {
  it("warns then saves with confirmDuplicate", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const first = await createTeacher(adminA, { ...baseInput, branchId: String(ids.a1) });
    expect(first.status).toBe("created");
    const warned = await createTeacher(adminA, { ...baseInput, branchId: String(ids.a1) });
    expect(warned.status).toBe("duplicate");
    const forced = await createTeacher(adminA, {
      ...baseInput,
      branchId: String(ids.a1),
      confirmDuplicate: true,
    });
    expect(forced.status).toBe("created");
  });
});

describe("teachers permanent delete", () => {
  it("requires archived status and manager role", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const supervisorA = memberCtx(users.supervisorA, ids.orgA, "supervisor", [ids.a1]);
    const created = await createTeacher(adminA, { ...baseInput, branchId: String(ids.a1) });
    const id = (created as { id: string }).id;
    await expect(deleteTeacherPermanently(adminA, id)).rejects.toThrow("VALIDATION");
    await archiveTeacher(adminA, id);
    await expect(deleteTeacherPermanently(supervisorA, id)).rejects.toThrow("FORBIDDEN");
    await updateTeacher(adminA, id, { ...baseInput, image: { url: "https://x/y.jpg", publicId: "p1" } });
    await deleteTeacherPermanently(adminA, id);
    expect(await Teacher.countDocuments({ _id: id })).toBe(0);
  });
});

describe("teachers stats and search", () => {
  it("counts and finds by normalized name or phone", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    await createTeacher(adminA, { ...baseInput, branchId: String(ids.a1) });
    await createTeacher(adminA, { name: "الشيخ علي", branchId: String(ids.a1) });
    const stats = await getTeacherStats(adminA);
    expect(stats.active).toBe(2);
    expect(stats.archived).toBe(0);
    expect(stats.addedThisMonth).toBe(2);
    const found = await listTeachers(adminA, { q: "الشيخ محمود" });
    expect(found.total).toBe(1);
    const byPhone = await listTeachers(adminA, { q: "01000000001" });
    expect(byPhone.total).toBe(1);
  });
});

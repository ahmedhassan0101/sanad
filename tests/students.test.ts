// اختبار خدمات الطلاب: العزل، البحث، التكرار، الحذف، الكود، الصلاحيات.
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
  archiveStudent,
  createStudent,
  deleteStudentPermanently,
  getStudent,
  getStudentStats,
  listStudents,
  regenerateParentCode,
  updateStudent,
} from "../services/students";

let replSet: MongoMemoryReplSet;
let ids: { orgA: Types.ObjectId; orgB: Types.ObjectId; a1: Types.ObjectId; a2: Types.ObjectId; b1: Types.ObjectId };

type Ctx = Parameters<typeof listStudents>[0];

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

const baseInput: {
  name: string;
  gender: "male" | "female";
  level: "beginner" | "intermediate" | "advanced";
  birthDate: string;
  guardians: { relation: "father" | "mother" | "brother" | "sister" | "grandfather" | "grandmother" | "uncle" | "aunt" | "other"; phone: string }[];
} = {
  name: "أحمد محمد",
  gender: "male",
  level: "beginner",
  birthDate: "2016-05-01",
  guardians: [{ relation: "father", phone: "01000000001" }],
};

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
  const adminA = await mk("AdminA", "aa@t.test");
  const adminB = await mk("AdminB", "ab@t.test");
  const supervisor = await mk("Teacher", "tt@t.test");
  const orgA = await Org.create({ name: "A", contactPhone: "01", createdByUserId: adminA._id });
  const orgB = await Org.create({ name: "B", contactPhone: "01", createdByUserId: adminB._id });
  const a1 = await Branch.create({ orgId: orgA._id, name: "A1" });
  const a2 = await Branch.create({ orgId: orgA._id, name: "A2" });
  const b1 = await Branch.create({ orgId: orgB._id, name: "B1" });
  await Membership.create({ userId: adminA._id, orgId: orgA._id, role: "center_admin" });
  await Membership.create({ userId: adminB._id, orgId: orgB._id, role: "center_admin" });
  await Membership.create({ userId: supervisor._id, orgId: orgA._id, role: "supervisor", branchIds: [a1._id] });
  ids = { orgA: orgA._id, orgB: orgB._id, a1: a1._id, a2: a2._id, b1: b1._id };
  (globalThis as Record<string, unknown>).__seedUsers = {
    adminA: adminA._id,
    adminB: adminB._id,
    supervisor: supervisor._id,
  };
});

function users() {
  return (globalThis as unknown as {
    __seedUsers: { adminA: Types.ObjectId; adminB: Types.ObjectId; supervisor: Types.ObjectId };
  }).__seedUsers;
}

describe("isolation", () => {
  it("reads and writes stay inside org and branch scope", async () => {
    const u = users();
    const adminA = memberCtx(u.adminA, ids.orgA, "center_admin", []);
    const adminB = memberCtx(u.adminB, ids.orgB, "center_admin", []);
    const supervisor = memberCtx(u.supervisor, ids.orgA, "supervisor", [ids.a1]);
    const created = await createStudent(adminA, { ...baseInput, branchId: String(ids.a1) });
    expect(created.status).toBe("created");
    const id = (created as { id: string }).id;
    await expect(getStudent(adminB, id)).rejects.toThrow("NOT_FOUND");
    const found = await getStudent(supervisor, id);
    expect(found.name).toBe("أحمد محمد");
    const inA2 = await createStudent(adminA, { ...baseInput, name: "طالب ثان", branchId: String(ids.a2) });
    await expect(getStudent(supervisor, (inA2 as { id: string }).id)).rejects.toThrow("NOT_FOUND");
    await expect(
      createStudent(supervisor, { ...baseInput, name: "طالب ثالث", branchId: String(ids.a2) }),
    ).rejects.toThrow("FORBIDDEN");
  });
});

describe("search", () => {
  it("finds by normalized arabic name and by phone digits", async () => {
    const u = users();
    const ctx = memberCtx(u.adminA, ids.orgA, "center_admin", []);
    await createStudent(ctx, { ...baseInput, name: "أحمد محمد", branchId: String(ids.a1) });
    const byName = await listStudents(ctx, { q: "احمد محمد" });
    expect(byName.total).toBe(1);
    const byPhone = await listStudents(ctx, { q: "01000000001" });
    expect(byPhone.total).toBe(1);
    const none = await listStudents(ctx, { q: "غير موجود" });
    expect(none.total).toBe(0);
  });
});

describe("duplicate warning", () => {
  it("warns then saves with confirmDuplicate", async () => {
    const u = users();
    const ctx = memberCtx(u.adminA, ids.orgA, "center_admin", []);
    const first = await createStudent(ctx, { ...baseInput, branchId: String(ids.a1) });
    expect(first.status).toBe("created");
    const warned = await createStudent(ctx, { ...baseInput, branchId: String(ids.a1) });
    expect(warned.status).toBe("duplicate");
    expect((warned as { duplicate: { name: string } }).duplicate.name).toBe("أحمد محمد");
    const forced = await createStudent(ctx, { ...baseInput, branchId: String(ids.a1), confirmDuplicate: true });
    expect(forced.status).toBe("created");
  });
});

describe("permanent delete", () => {
  it("requires archived status and manager role", async () => {
    const u = users();
    const adminA = memberCtx(u.adminA, ids.orgA, "center_admin", []);
    const supervisor = memberCtx(u.supervisor, ids.orgA, "supervisor", [ids.a1]);
    const created = await createStudent(adminA, { ...baseInput, branchId: String(ids.a1) });
    const id = (created as { id: string }).id;
    await expect(deleteStudentPermanently(adminA, id)).rejects.toThrow("VALIDATION");
    await archiveStudent(adminA, id);
    await expect(deleteStudentPermanently(supervisor, id)).rejects.toThrow("FORBIDDEN");
    await deleteStudentPermanently(adminA, id);
    expect(await Student.countDocuments({ _id: id })).toBe(0);
  });
});

describe("parentCode", () => {
  it("unique 10-char codes, regenerable", async () => {
    const u = users();
    const ctx = memberCtx(u.adminA, ids.orgA, "center_admin", []);
    const a = await createStudent(ctx, { ...baseInput, branchId: String(ids.a1) });
    const b = await createStudent(ctx, { ...baseInput, name: "اسم آخر", branchId: String(ids.a1) });
    const sa = await getStudent(ctx, (a as { id: string }).id);
    const sb = await getStudent(ctx, (b as { id: string }).id);
    expect(sa.parentCode).toHaveLength(10);
    expect(sa.parentCode).not.toBe(sb.parentCode);
    const regen = await regenerateParentCode(ctx, (a as { id: string }).id);
    expect(regen.parentCode).toHaveLength(10);
    expect(regen.parentCode).not.toBe(sa.parentCode);
  });
});

describe("update", () => {
  it("edits position only, start stays unchanged", async () => {
    const u = users();
    const ctx = memberCtx(u.adminA, ids.orgA, "center_admin", []);
    const created = await createStudent(ctx, {
      ...baseInput,
      hifz: { surah: 112, ayah: 1 },
      branchId: String(ids.a1),
    });
    const id = (created as { id: string }).id;
    await updateStudent(ctx, id, {
      ...baseInput,
      level: "intermediate",
      hifzPosition: { surah: 112, ayah: 4 },
    });
    const s = await getStudent(ctx, id);
    expect(s.hifzPosition).toMatchObject({ surah: 112, ayah: 4 });
    expect(s.hifzStart).toMatchObject({ surah: 112, ayah: 1 });
    expect(s.level).toBe("intermediate");
  });
});

describe("stats", () => {
  it("counts active, incomplete, monthly and archived", async () => {
    const u = users();
    const ctx = memberCtx(u.adminA, ids.orgA, "center_admin", []);
    await createStudent(ctx, { ...baseInput, branchId: String(ids.a1) });
    await createStudent(ctx, { name: "بلا بيانات", gender: "female", level: "beginner", guardians: [], branchId: String(ids.a1) });
    const stats = await getStudentStats(ctx);
    expect(stats.active).toBe(2);
    expect(stats.incomplete).toBe(1);
    expect(stats.addedThisMonth).toBe(2);
    expect(stats.archived).toBe(0);
  });
});

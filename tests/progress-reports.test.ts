// اختبار التقارير: العزل، تحديث الموضع، الصلاحيات، رفض المؤرشف، صحة الحساب.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
import { ProgressReport } from "@/db/models/ProgressReport";
import { can } from "@/lib/permissions/roles";
import {
  createReport,
  deleteReport,
  listReports,
  updateReport,
} from "../services/progress-reports";
import { archiveStudent, deleteStudentPermanently } from "../services/students";

let replSet: MongoMemoryReplSet;
let ids: {
  orgA: Types.ObjectId;
  orgB: Types.ObjectId;
  a1: Types.ObjectId;
  a2: Types.ObjectId;
  ownerA: Types.ObjectId;
  teacherA: Types.ObjectId;
  studentA: Types.ObjectId;
  studentB: Types.ObjectId;
};

type Ctx = Parameters<typeof listReports>[0];

function memberCtx(
  userId: Types.ObjectId,
  orgId: Types.ObjectId,
  role: "center_admin" | "branch_admin" | "teacher",
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

const reportInput = {
  hifzPosition: { surah: 112, ayah: 1 },
  tajweedRating: "good",
  trend: "stable",
  notes: "ملاحظة",
} as const;

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
  const ownerA = await mk("OwnerA", "oa@r.test");
  const teacherA = await mk("TeacherA", "ta@r.test");
  const ownerB = await mk("OwnerB", "ob@r.test");
  const orgA = await Org.create({ name: "A", contactPhone: "01", createdByUserId: ownerA._id });
  const orgB = await Org.create({ name: "B", contactPhone: "01", createdByUserId: ownerB._id });
  const a1 = await Branch.create({ orgId: orgA._id, name: "A1" });
  const a2 = await Branch.create({ orgId: orgA._id, name: "A2" });
  const b1 = await Branch.create({ orgId: orgB._id, name: "B1" });
  await Membership.create({ userId: ownerA._id, orgId: orgA._id, role: "center_admin" });
  await Membership.create({ userId: ownerB._id, orgId: orgB._id, role: "center_admin" });
  await Membership.create({ userId: teacherA._id, orgId: orgA._id, role: "teacher", branchIds: [a1._id] });
  const mkStudent = (orgId: Types.ObjectId, branchId: Types.ObjectId, name: string) =>
    Student.create({
      orgId,
      branchId,
      name,
      nameSearch: name,
      gender: "male",
      level: "beginner",
      guardians: [],
      hifzStart: { surah: 114, ayah: 1 },
      hifzPosition: { surah: 114, ayah: 1 },
      parentCode: `CODE-${name}-${Date.now()}`,
    });
  const studentA = await mkStudent(orgA._id, a1._id, "طالب أ");
  const studentB = await mkStudent(orgB._id, b1._id, "طالب ب");
  ids = { orgA: orgA._id, orgB: orgB._id, a1: a1._id, a2: a2._id, ownerA: ownerA._id, teacherA: teacherA._id, studentA: studentA._id, studentB: studentB._id };
});

describe("matrix", () => {
  it("all roles create/edit, only managers delete", () => {
    expect(can("center_admin", "report:create")).toBe(true);
    expect(can("branch_admin", "report:edit")).toBe(true);
    expect(can("teacher", "report:create")).toBe(true);
    expect(can("teacher", "report:delete")).toBe(false);
    expect(can("branch_admin", "report:delete")).toBe(true);
  });
});

describe("isolation", () => {
  it("no cross-org or cross-branch report access", async () => {
    const ownerA = memberCtx(ids.ownerA, ids.orgA, "center_admin", []);
    const ownerB = memberCtx(
      (await User.findOne({ email: "ob@r.test" }))!._id,
      ids.orgB,
      "center_admin",
      [],
    );
    const teacherA = memberCtx(ids.teacherA, ids.orgA, "teacher", [ids.a1]);
    await createReport(ownerA, String(ids.studentA), { ...reportInput });
    await expect(listReports(ownerB, String(ids.studentA))).rejects.toThrow("NOT_FOUND");
    await expect(createReport(ownerB, String(ids.studentA), { ...reportInput })).rejects.toThrow("NOT_FOUND");
    // teacher out of branch scope cannot touch A2 student
    const s2 = await Student.create({
      orgId: ids.orgA,
      branchId: ids.a2,
      name: "طالب أ2",
      nameSearch: "طالب أ2",
      gender: "male",
      level: "beginner",
      guardians: [],
      parentCode: "CODE-A2",
    });
    await expect(listReports(teacherA, String(s2._id))).rejects.toThrow("NOT_FOUND");
    await expect(
      createReport(teacherA, String(s2._id), { ...reportInput }),
    ).rejects.toThrow("NOT_FOUND");
  });
});

describe("position sync", () => {
  it("create/update/delete move student position, empty returns to start", async () => {
    const ctx = memberCtx(ids.ownerA, ids.orgA, "center_admin", []);
    const r1 = await createReport(ctx, String(ids.studentA), {
      ...reportInput,
      hifzPosition: { surah: 113, ayah: 5 },
    });
    let s = await Student.findById(ids.studentA);
    expect(s?.hifzPosition).toMatchObject({ surah: 113, ayah: 5 });
    const r2 = await createReport(ctx, String(ids.studentA), {
      ...reportInput,
      hifzPosition: { surah: 114, ayah: 6 },
    });
    s = await Student.findById(ids.studentA);
    expect(s?.hifzPosition).toMatchObject({ surah: 114, ayah: 6 });
    await updateReport(ctx, r2.id, { ...reportInput, hifzPosition: { surah: 112, ayah: 4 } });
    s = await Student.findById(ids.studentA);
    expect(s?.hifzPosition).toMatchObject({ surah: 112, ayah: 4 });
    await deleteReport(ctx, r2.id);
    s = await Student.findById(ids.studentA);
    expect(s?.hifzPosition).toMatchObject({ surah: 113, ayah: 5 });
    await deleteReport(ctx, r1.id);
    s = await Student.findById(ids.studentA);
    expect(s?.hifzPosition).toMatchObject({ surah: 114, ayah: 1 });
  });
});

describe("consecutive math", () => {
  it("previous positions and ayah counts are correct", async () => {
    const ctx = memberCtx(ids.ownerA, ids.orgA, "center_admin", []);
    await createReport(ctx, String(ids.studentA), { ...reportInput, hifzPosition: { surah: 113, ayah: 5 } });
    await createReport(ctx, String(ids.studentA), { ...reportInput, hifzPosition: { surah: 114, ayah: 6 } });
    const { items, total } = await listReports(ctx, String(ids.studentA));
    expect(total).toBe(2);
    expect(items[0]!.previous).toMatchObject({ surah: 113, ayah: 5 });
    expect(items[0]!.ayahs).toBe(6);
    expect(items[1]!.isFirst).toBe(true);
    expect(items[1]!.previous).toMatchObject({ surah: 114, ayah: 1 });
    expect(items[1]!.ayahs).toBe(1);
  });
});

describe("archived + delete rules", () => {
  it("rejects reports for archived students; delete removes reports", async () => {
    const u = { ownerA: ids.ownerA, teacherA: ids.teacherA };
    const ctx = memberCtx(u.ownerA, ids.orgA, "center_admin", []);
    await archiveStudent(ctx, String(ids.studentA));
    await expect(createReport(ctx, String(ids.studentA), { ...reportInput })).rejects.toThrow(
      "مؤرشف",
    );
    const tctx = memberCtx(u.teacherA, ids.orgA, "teacher", [ids.a1]);
    await expect(deleteReport(tctx, "000000000000000000000000")).rejects.toThrow();
    await deleteStudentPermanently(ctx, String(ids.studentA));
    expect(await ProgressReport.countDocuments({ studentId: ids.studentA })).toBe(0);
  });
});

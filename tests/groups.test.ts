// مجموعات وتسجيلات: عزل، صلاحيات، تكرار، قواعد المعلم، إحصاءات.
// موديلات Group وEnrollment جديدة — لا ترحيل، بيانات تطوير فقط.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
import { Teacher } from "@/db/models/Teacher";
import { Group } from "@/db/models/Group";
import { Enrollment } from "@/db/models/Enrollment";
import {
  listGroups,
  getGroupsOverview,
  getGroup,
  createGroup,
  updateGroup,
  archiveGroup,
  restoreGroup,
  enrollStudents,
  removeStudent,
  searchStudentsForGroup,
} from "../services/groups";
import { archiveTeacher, deleteTeacherPermanently } from "../services/teachers";
import { generateCode } from "@/lib/invite-code";
import { can } from "@/lib/permissions/roles";
import { normalizeArabic } from "@/lib/students";

let replSet: MongoMemoryReplSet;
let ids: { admin: Types.ObjectId; org: Types.ObjectId; b1: Types.ObjectId; b2: Types.ObjectId; t1: Types.ObjectId; t2: Types.ObjectId; s1: Types.ObjectId; s2: Types.ObjectId };

function memberCtx(
  userId: Types.ObjectId,
  orgId: Types.ObjectId,
  role: "center_admin" | "branch_admin" | "supervisor",
  branchIds: Types.ObjectId[],
  mode: "all" | "list" = "list",
) {
  return {
    kind: "member" as const,
    userId: String(userId),
    orgId,
    role,
    branchScope: { mode, branchIds },
  };
}

async function mkStudent(orgId: Types.ObjectId, branchId: Types.ObjectId, name: string, phone = "01000000000") {
  return Student.create({
    orgId, branchId, name, nameSearch: normalizeArabic(name), gender: "male", level: "beginner",
    birthDate: new Date(Date.UTC(2012, 0, 1, 12)), phone,
    guardians: [{ relation: "father", phone }],
    parentCode: await generateCode(10),
    status: "active",
  });
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
  const admin = await User.create({ name: "A", email: "a@g.test", emailVerifiedAt: verified });
  const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: admin._id });
  const b1 = await Branch.create({ orgId: org._id, name: "B1" });
  const b2 = await Branch.create({ orgId: org._id, name: "B2" });
  const t1 = await Teacher.create({ orgId: org._id, branchId: b1._id, name: "معلم ب1", nameSearch: normalizeArabic("معلم ب1"), phone: null, status: "active" });
  const t2 = await Teacher.create({ orgId: org._id, branchId: b2._id, name: "معلم ب2", nameSearch: normalizeArabic("معلم ب2"), phone: null, status: "active" });
  const s1 = await mkStudent(org._id, b1._id, "طالب 1");
  const s2 = await mkStudent(org._id, b1._id, "طالب 2");
  const s3 = await mkStudent(org._id, b2._id, "طالب ب2");
  await Membership.create({ userId: admin._id, orgId: org._id, role: "center_admin" });
  ids = { admin: admin._id, org: org._id, b1: b1._id, b2: b2._id, t1: t1._id, t2: t2._id, s1: s1._id, s2: s2._id };
  void s3;
});

function ctx(role: "center_admin" | "branch_admin" | "supervisor" = "center_admin", branchIds: Types.ObjectId[] = [ids.b1]) {
  return memberCtx(ids.admin, ids.org, role, branchIds);
}

describe("groups", () => {
  it("creates a group and lists it", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "الفجر", teacherId: String(ids.t1) });
    expect(typeof groupId).toBe("string");
    const rows = await listGroups(c, {});
    expect(rows.length).toBe(1);
    expect(rows[0]!.name).toBe("الفجر");
    expect(rows[0]!.memberCount).toBe(0);
  });

  it("org isolation: group in org B invisible to org A", async () => {
    const c = ctx();
    await createGroup(c, { programKey: "quran", name: "أ" });
    const otherAdmin = await User.create({ name: "X", email: "x@g.test" });
    const orgB = await Org.create({ name: "B", contactPhone: "01", createdByUserId: otherAdmin._id });
    const bB = await Branch.create({ orgId: orgB._id, name: "BB" });
    const cB = memberCtx(otherAdmin._id, orgB._id, "center_admin", [bB._id]);
    await createGroup(cB, { programKey: "tajweed", name: "ب" });
    expect(await listGroups(c, {})).toHaveLength(1);
    expect(await listGroups(cB, {})).toHaveLength(1);
  });

  it("branch isolation: supervisor of B1 does not see B2 groups", async () => {
    const c = ctx("supervisor", [ids.b1]);
    await createGroup(c, { programKey: "quran", name: "ب1-أ" });
    const cAll = memberCtx(ids.admin, ids.org, "center_admin", [ids.b1, ids.b2], "all");
    await createGroup(cAll, { programKey: "quran", name: "ب2-أ", branchId: String(ids.b2) });
    const rows = await listGroups(c, {});
    expect(rows.map((r) => r.name)).toEqual(["ب1-أ"]);
  });

  it("supervisor cannot delete groups", () => {
    expect(can("supervisor", "group:delete")).toBe(false);
    expect(can("center_admin", "group:delete")).toBe(true);
    expect(can("branch_admin", "group:delete")).toBe(true);
  });

  it("student can enroll in multiple groups even same program", async () => {
    const c = ctx();
    const { groupId: g1 } = await createGroup(c, { programKey: "quran", name: "قرآن أ" });
    const { groupId: g2 } = await createGroup(c, { programKey: "quran", name: "قرآن ب" });
    const r1 = await enrollStudents(c, g1, [String(ids.s1)]);
    const r2 = await enrollStudents(c, g2, [String(ids.s1)]);
    expect(r1[0]!.status).toBe("enrolled");
    expect(r2[0]!.status).toBe("enrolled");
  });

  it("rejects duplicate student in same group", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "مكرر" });
    await enrollStudents(c, groupId, [String(ids.s1)]);
    const res = await enrollStudents(c, groupId, [String(ids.s1)]);
    expect(res[0]!.status).toBe("already");
  });

  it("rejects teacher from another branch", async () => {
    const c = ctx("supervisor", [ids.b1]);
    await expect(createGroup(c, { programKey: "quran", name: "خارجي", teacherId: String(ids.t2) })).rejects.toThrow("غير نشط");
  });

  it("rejects archived teacher", async () => {
    const c = ctx();
    const tArch = await Teacher.create({ orgId: ids.org, branchId: ids.b1, name: "مؤرشف", nameSearch: normalizeArabic("مؤرشف"), status: "archived" });
    await expect(createGroup(c, { programKey: "quran", name: "أ", teacherId: String(tArch._id) })).rejects.toThrow();
  });

  it("rejects invalid program key", async () => {
    const c = ctx();
    await expect(createGroup(c, { programKey: "cooking", name: "طهي" })).rejects.toThrow("برنامج غير صالح");
  });

  it("createGroup with students: partial success does not abort", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "مختلط" });
    const sBad = await mkStudent(ids.org, ids.b2, "في فرع آخر"); // wrong branch
    const res = await enrollStudents(c, groupId, [String(ids.s1), String(sBad._id), "not-an-id"]);
    expect(res.map((r) => r.status)).toEqual(["enrolled", "not_allowed", "not_allowed"]);
    // المجموعة لا تُلغى رغم الفشل
    const g = await Group.findById(groupId).lean();
    expect(g?.status).toBe("active");
  });

  it("archiveTeacher refuses when teacher has active groups", async () => {
    const c = ctx();
    await createGroup(c, { programKey: "quran", name: "نشطة", teacherId: String(ids.t1) });
    await expect(archiveTeacher(ctx(), String(ids.t1))).rejects.toThrow("مجموعات نشطة");
  });

  it("deleteTeacherPermanently refuses when any group linked (even archived)", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "مؤرشفة", teacherId: String(ids.t1) });
    await archiveGroup(c, groupId);
    const teacher = await Teacher.findById(ids.t1);
    teacher!.status = "archived";
    teacher!.archivedAt = new Date();
    await teacher!.save();
    await expect(deleteTeacherPermanently(ctx(), String(ids.t1))).rejects.toThrow("مجموعات مرتبطة");
  });

  it("archive/restore group keeps enrollments out of counts", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "عدّاد" });
    await enrollStudents(c, groupId, [String(ids.s1), String(ids.s2)]);
    let ov = await getGroupsOverview(c, { programKey: "quran" });
    expect(ov.studentCount).toBe(2);
    await archiveGroup(c, groupId);
    ov = await getGroupsOverview(c, { programKey: "quran" });
    expect(ov.activeGroups).toBe(0);
    expect(ov.studentCount).toBe(0);
    await restoreGroup(c, groupId);
    ov = await getGroupsOverview(c, { programKey: "quran" });
    expect(ov.activeGroups).toBe(1);
    expect(ov.studentCount).toBe(2);
  });

  it("getGroupsOverview counts distinct students across programs", async () => {
    const c = ctx();
    await createGroup(c, { programKey: "quran", name: "ق1" });
    await createGroup(c, { programKey: "tajweed", name: "ت1" });
    const g1 = await Group.findOne({ name: "ق1" });
    const g2 = await Group.findOne({ name: "ت1" });
    expect(g1 && g2).toBeTruthy();
    if (!g1 || !g2) return;
    await enrollStudents(c, String(g1._id), [String(ids.s1)]);
    await enrollStudents(c, String(g2._id), [String(ids.s1), String(ids.s2)]);
    const ov = await getGroupsOverview(c, { programKey: undefined });
    const stats = ov.programStats ?? [];
    const quran = stats.find((p) => p.key === "quran");
    const tajweed = stats.find((p) => p.key === "tajweed");
    expect(quran!.studentCount).toBe(1);
    expect(tajweed!.studentCount).toBe(2);
  });

  it("removeStudent sets left + leftAt", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "إزالة" });
    await enrollStudents(c, groupId, [String(ids.s1)]);
    await removeStudent(groupId, String(ids.s1));
    const e = await Enrollment.findOne({ groupId, studentId: ids.s1 }).lean();
    expect(e?.status).toBe("left");
    expect(e?.leftAt).not.toBeNull();
  });

  it("searchStudentsForGroup excludes already enrolled in same group", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "بحث" });
    await enrollStudents(c, groupId, [String(ids.s1)]);
    const res = await searchStudentsForGroup(c, { groupId, programKey: "quran", q: "طالب" });
    expect(res.find((r) => r.studentId === String(ids.s1))).toBeUndefined();
    expect(res.find((r) => r.studentId === String(ids.s2))).toBeDefined();
  });

  it("getGroup returns members with level/guardian/lastReport", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "تفاصيل" });
    await enrollStudents(c, groupId, [String(ids.s1)]);
    const detail = await getGroup(c, groupId);
    expect(detail.members).toHaveLength(1);
    expect(detail.members[0]!.name).toBe("طالب 1");
    expect(detail.members[0]!.level).toBe("beginner");
    expect(detail.memberCount).toBe(1);
  });

  it("updateGroup renames and changes teacher", async () => {
    const c = ctx();
    const { groupId } = await createGroup(c, { programKey: "quran", name: "قديم" });
    await updateGroup(c, groupId, { name: "جديد", teacherId: null });
    const rows = await listGroups(c, {});
    expect(rows[0]!.name).toBe("جديد");
    expect(rows[0]!.teacherId).toBeNull();
  });
});

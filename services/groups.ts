// خدمات المجموعات والتسجيلات: عزل دائم بـ scopedFilter، والتحقق من الفرع والمعلم والبرنامج.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Branch } from "@/db/models/Branch";
import { Group } from "@/db/models/Group";
import { Enrollment } from "@/db/models/Enrollment";
import { Student } from "@/db/models/Student";
import { Teacher } from "@/db/models/Teacher";
import { getLatestReportKeys } from "@/services/progress-reports";
import { can, type Action } from "@/lib/permissions/roles";
import { normalizeArabic } from "@/lib/students";
import type { SessionContext } from "@/lib/tenant/context";
import { scopedFilter } from "@/lib/tenant/scopedFilter";
import { PROGRAM_CATALOG } from "@/lib/programs";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

const PROGRAM_KEYS: Set<string> = new Set(PROGRAM_CATALOG.map((p) => p.key));

function requirePerm(ctx: MemberCtx, action: Action) {
  if (!can(ctx.role, action)) throw new Error("FORBIDDEN: لا صلاحية لديك");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function validProgramKey(key: string): boolean {
  return PROGRAM_KEYS.has(key);
}

// الفرع من النطاق على السيرفر (نفس منطق الطلاب/المعلمين).
async function resolveBranch(ctx: MemberCtx, branchId?: string): Promise<Types.ObjectId> {
  await connectDB();
  const branches = await Branch.find({ orgId: ctx.orgId, status: "active" })
    .select("_id")
    .lean();
  const inScope = (id: Types.ObjectId) =>
    ctx.branchScope.mode === "all" || ctx.branchScope.branchIds.some((b) => b.equals(id));
  if (branchId) {
    if (!Types.ObjectId.isValid(branchId)) throw new Error("VALIDATION: الفرع غير صحيح");
    const found = branches.find((b) => String(b._id) === branchId);
    if (!found || !inScope(found._id)) throw new Error("FORBIDDEN: فرع خارج نطاقك");
    return found._id;
  }
  if (branches.length === 1 && inScope(branches[0]!._id)) return branches[0]!._id;
  throw new Error("VALIDATION: اختر الفرع");
}

function inScopeOrThrow(ctx: MemberCtx, branchId: Types.ObjectId) {
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(branchId))) {
    throw new Error("NOT_FOUND");
  }
}

// العدادات النشطة لكل مجموعة باستعلام تجميعي واحد.
async function memberCounts(ctx: MemberCtx, groupIds: Types.ObjectId[]): Promise<Map<string, number>> {
  if (groupIds.length === 0) return new Map();
  const rows = await Enrollment.aggregate([
    { $match: { orgId: ctx.orgId, groupId: { $in: groupIds }, status: "active" } },
    { $group: { _id: "$groupId", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

export interface GroupListQuery {
  programKey?: string;
  q?: string;
  teacherId?: string;
  status?: string;
}

export interface GroupRow {
  id: string;
  orgId: Types.ObjectId;
  branchId: Types.ObjectId;
  programKey: string;
  programName: string;
  name: string;
  scheduleText: string | null;
  teacherId: Types.ObjectId | null;
  teacherName: string | null;
  notes: string | null;
  status: "active" | "archived";
  archivedAt: Date | null;
  memberCount: number;
  createdAt: Date;
}

export async function listGroups(ctx: MemberCtx, query: GroupListQuery): Promise<GroupRow[]> {
  requirePerm(ctx, "group:create");
  await connectDB();
  const { programKey, q, teacherId, status = "active" } = query;
  const filter: Record<string, unknown> = { ...scopedFilter(ctx), status };
  if (programKey) {
    if (!validProgramKey(programKey)) throw new Error("VALIDATION: برنامج غير صالح");
    filter.programKey = programKey;
  }
  if (teacherId) filter.teacherId = new Types.ObjectId(teacherId);
  const trimmed = (q ?? "").trim();
  if (trimmed) {
    const norm = normalizeArabic(trimmed);
    filter.$or = [
      { name: new RegExp(escapeRegex(norm), "i") },
      { scheduleText: new RegExp(escapeRegex(trimmed), "i") },
    ];
  }
  const groups = await Group.find(filter)
    .sort({ programKey: 1, name: 1 })
    .lean();
  const counts = await memberCounts(ctx, groups.map((g) => g._id));
  const teacherIds = [...new Set(groups.filter((g) => g.teacherId).map((g) => g.teacherId))];
  const teachers = teacherIds.length
    ? await Teacher.find({ _id: { $in: teacherIds }, orgId: ctx.orgId }).select("_id name").lean()
    : [];
  const teacherMap = new Map<string, string>(teachers.map((t) => [String(t._id), t.name]));
  const programMap = new Map<string, string>(PROGRAM_CATALOG.map((p) => [p.key, p.name]));
  return groups.map((g) => ({
    id: String(g._id),
    orgId: g.orgId,
    branchId: g.branchId,
    programKey: g.programKey,
    programName: programMap.get(g.programKey) ?? g.programKey,
    name: g.name,
    scheduleText: g.scheduleText,
    teacherId: g.teacherId,
    teacherName: g.teacherId ? (teacherMap.get(String(g.teacherId)) ?? null) : null,
    notes: g.notes,
    status: g.status,
    archivedAt: g.archivedAt,
    memberCount: counts.get(String(g._id)) ?? 0,
    createdAt: g.createdAt,
  }));
}

export interface GroupsOverview {
  programKey?: string;
  activeGroups: number;
  studentCount: number;
  teacherCount: number;
  groupsWithoutTeacher: number;
}

// العدادات المختصرة لكل برنامج بتجميع واحد ($group على programKey).
export async function getGroupsOverview(ctx: MemberCtx, { programKey }: { programKey?: string }) {
  requirePerm(ctx, "group:create");
  await connectDB();
  const base = scopedFilter(ctx);
  const activeFilter = { ...base, status: "active" };

  if (programKey) {
    if (!validProgramKey(programKey)) throw new Error("VALIDATION: برنامج غير صالح");
    const [groupsRes, studentsRes, teachersRes, noTeacherRes] = await Promise.all([
      Group.countDocuments({ ...activeFilter, programKey }),
      Enrollment.aggregate([
        { $match: { ...base, programKey, status: "active" } },
        { $group: { _id: null, students: { $addToSet: "$studentId" } } },
        { $project: { count: { $size: "$students" }, _id: 0 } },
      ]),
      Group.aggregate([
        { $match: { ...activeFilter, programKey, teacherId: { $ne: null } } },
        { $group: { _id: null, teachers: { $addToSet: "$teacherId" } } },
        { $project: { count: { $size: "$teachers" }, _id: 0 } },
      ]),
      Group.countDocuments({ ...activeFilter, programKey, teacherId: null }),
    ]);
    const p = PROGRAM_CATALOG.find((p) => p.key === programKey)!;
    return {
      programKey,
      programName: p.name,
      activeGroups: groupsRes,
      studentCount: studentsRes[0]?.count ?? 0,
      teacherCount: teachersRes[0]?.count ?? 0,
      groupsWithoutTeacher: noTeacherRes,
    };
  }

  // الإجماليات لكل المركز + عدّادات مختصرة لكل برنامج بتجميع واحد.
  const [
    activeGroupsTotal,
    studentDistinctTotal,
    teacherDistinctTotal,
    noTeacherTotal,
    groupStats,
    studentStats,
    teacherStats,
    noTeacherStats,
  ] = await Promise.all([
    Group.countDocuments(activeFilter),
    Enrollment.aggregate([
      { $match: { ...base, status: "active" } },
      { $group: { _id: null, students: { $addToSet: "$studentId" } } },
      { $project: { count: { $size: "$students" }, _id: 0 } },
    ]),
    Group.aggregate([
      { $match: { ...activeFilter, teacherId: { $ne: null } } },
      { $group: { _id: null, teachers: { $addToSet: "$teacherId" } } },
      { $project: { count: { $size: "$teachers" }, _id: 0 } },
    ]),
    Group.countDocuments({ ...activeFilter, teacherId: null }),
    Group.aggregate([
      { $match: { ...activeFilter } },
      { $group: { _id: "$programKey", activeGroups: { $sum: 1 } } },
    ]),
    Enrollment.aggregate([
      { $match: { ...base, status: "active" } },
      { $group: { _id: "$programKey", students: { $addToSet: "$studentId" } } },
      { $project: { programKey: "$_id", studentCount: { $size: "$students" }, _id: 0 } },
    ]),
    Group.aggregate([
      { $match: { ...activeFilter, teacherId: { $ne: null } } },
      { $group: { _id: "$programKey", teachers: { $addToSet: "$teacherId" } } },
      { $project: { programKey: "$_id", teacherCount: { $size: "$teachers" }, _id: 0 } },
    ]),
    Group.aggregate([
      { $match: { ...activeFilter, teacherId: null } },
      { $group: { _id: "$programKey", count: { $sum: 1 } } },
    ]),
  ]);

  const getCount = (rows: { _id: unknown; count?: number }[], key: string) => {
    const r = rows.find((x) => String(x._id) === key);
    return r ? (r.count ?? 0) : 0;
  };

  const programStats = PROGRAM_CATALOG.map((p) => ({
    key: p.key,
    name: p.name,
    activeGroups: getCount(groupStats, p.key),
    studentCount: getCount(studentStats, p.key),
    teacherCount: getCount(teacherStats, p.key),
    groupsWithoutTeacher: getCount(noTeacherStats, p.key),
  }));

  return {
    programKey: undefined,
    programName: undefined,
    activeGroups: activeGroupsTotal,
    studentCount: studentDistinctTotal[0]?.count ?? 0,
    teacherCount: teacherDistinctTotal[0]?.count ?? 0,
    groupsWithoutTeacher: noTeacherTotal,
    programStats,
  };
}

export interface GroupDetail extends GroupRow {
  members: Array<{
    studentId: string;
    name: string;
    level: string;
    phone: string | null;
    guardianPhone: string | null;
    hifzPosition: { surah: number; ayah: number } | null;
    lastReport: string | null;
    joinedAt: Date | null;
  }>;
}

export async function getGroup(ctx: MemberCtx, id: string): Promise<GroupDetail> {
  requirePerm(ctx, "group:create");
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const group = await Group.findOne({ _id: id, orgId: ctx.orgId }).lean();
  if (!group) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, group.branchId);
  const enrollments = await Enrollment.find({
    orgId: ctx.orgId,
    groupId: group._id,
    status: "active",
  })
    .sort({ joinedAt: 1 })
    .lean();
  const studentIds = enrollments.map((e) => e.studentId);
  const students = await Student.find({ _id: { $in: studentIds }, orgId: ctx.orgId }).lean();
  const studentMap = new Map(students.map((s) => [String(s._id), s]));
  const latestKeys = await getLatestReportKeys(ctx, studentIds);
  const teacher = group.teacherId
    ? await Teacher.findOne({ _id: group.teacherId, orgId: ctx.orgId }).select("_id name").lean()
    : null;
  const members = enrollments.map((e) => {
    const s = studentMap.get(String(e.studentId));
    return {
      studentId: String(e.studentId),
      name: s?.name ?? "",
      level: s?.level ?? "",
      phone: s?.phone ?? null,
      guardianPhone: (s?.guardians?.[0]?.phone ?? null) ?? null,
      hifzPosition: s?.hifzPosition ?? null,
      lastReport: latestKeys.get(String(e.studentId)) ?? null,
      joinedAt: e.joinedAt,
    };
  });
  return {
    id: String(group._id),
    orgId: group.orgId,
    branchId: group.branchId,
    programKey: group.programKey,
    programName: PROGRAM_CATALOG.find((p) => p.key === group.programKey)?.name ?? group.programKey,
    name: group.name,
    scheduleText: group.scheduleText,
    teacherId: group.teacherId,
    teacherName: teacher ? teacher.name : null,
    notes: group.notes,
    status: group.status,
    archivedAt: group.archivedAt,
    memberCount: members.length,
    createdAt: group.createdAt,
    members,
  };
}

interface CreateGroupInput {
  branchId?: string;
  programKey: string;
  name: string;
  scheduleText?: string;
  teacherId?: string;
  notes?: string;
  studentIds?: string[];
}

interface CreateGroupResult {
  groupId: string;
  enrollmentResults: Array<{ studentId: string; status: "enrolled" | "already" | "not_allowed"; reason?: string }>;
}

export async function createGroup(ctx: MemberCtx, input: CreateGroupInput): Promise<CreateGroupResult> {
  requirePerm(ctx, "group:create");
  const branchId = await resolveBranch(ctx, input.branchId);
  if (!validProgramKey(input.programKey)) throw new Error("VALIDATION: برنامج غير صالح");
  const name = input.name.trim();
  if (!name) throw new Error("VALIDATION: اسم المجموعة مطلوب");
  const exists = await Group.findOne({
    orgId: ctx.orgId,
    branchId,
    programKey: input.programKey,
    name,
    status: "active",
  });
  if (exists) throw new Error("VALIDATION: اسم مجموعة موجود بالفعل في هذا الفرع والبرنامج");
  if (input.teacherId) {
    const teacher = await Teacher.findOne({
      _id: input.teacherId,
      orgId: ctx.orgId,
      branchId,
      status: "active",
    });
    if (!teacher) throw new Error("VALIDATION: المعلم غير نشط أو ليس في هذا الفرع");
  }
  const group = await Group.create({
    orgId: ctx.orgId,
    branchId,
    programKey: input.programKey,
    name,
    scheduleText: input.scheduleText ?? null,
    teacherId: input.teacherId ?? null,
    notes: input.notes ?? null,
    status: "active",
    archivedAt: null,
  });
  const enrollmentResults = await enrollStudents(ctx, String(group._id), input.studentIds ?? []);
  return { groupId: String(group._id), enrollmentResults };
}

interface UpdateGroupInput {
  name?: string;
  scheduleText?: string;
  teacherId?: string;
  notes?: string;
}

export async function updateGroup(
  ctx: MemberCtx,
  id: string,
  input: UpdateGroupInput,
): Promise<void> {
  requirePerm(ctx, "group:edit");
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const group = await Group.findOne({ _id: id, orgId: ctx.orgId });
  if (!group) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, group.branchId);
  if (input.name !== undefined) {
    const name = input.name.trim();
    if (!name) throw new Error("VALIDATION: اسم المجموعة مطلوب");
    const exists = await Group.findOne({
      orgId: ctx.orgId,
      branchId: group.branchId,
      programKey: group.programKey,
      name,
      status: "active",
      _id: { $ne: id },
    });
    if (exists) throw new Error("VALIDATION: اسم مجموعة موجود بالفعل في هذا الفرع والبرنامج");
    group.name = name;
  }
  if (input.scheduleText !== undefined) group.scheduleText = input.scheduleText ?? null;
  if (input.notes !== undefined) group.notes = input.notes ?? null;
  if (input.teacherId !== undefined) {
    if (input.teacherId) {
      const teacher = await Teacher.findOne({
        _id: input.teacherId,
        orgId: ctx.orgId,
        branchId: group.branchId,
        status: "active",
      });
      if (!teacher) throw new Error("VALIDATION: المعلم غير نشط أو ليس في هذا الفرع");
      group.teacherId = new Types.ObjectId(input.teacherId);
    } else {
      group.teacherId = null;
    }
  }
  await group.save();
}

export async function archiveGroup(ctx: MemberCtx, id: string): Promise<void> {
  requirePerm(ctx, "group:archive");
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const group = await Group.findOne({ _id: id, orgId: ctx.orgId });
  if (!group) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, group.branchId);
  group.status = "archived";
  group.archivedAt = new Date();
  await group.save();
}

export async function restoreGroup(ctx: MemberCtx, id: string): Promise<void> {
  requirePerm(ctx, "group:archive");
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const group = await Group.findOne({ _id: id, orgId: ctx.orgId });
  if (!group) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, group.branchId);
  group.status = "active";
  group.archivedAt = null;
  await group.save();
}

export async function deleteGroupPermanently(ctx: MemberCtx, id: string): Promise<void> {
  requirePerm(ctx, "group:delete");
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const group = await Group.findOne({ _id: id, orgId: ctx.orgId });
  if (!group) throw new Error("NOT_FOUND");
  if (group.status !== "archived")
    throw new Error("VALIDATION: احذف المجموعة المؤرشفة فقط — أرشف المجموعة أولًا");
  await Enrollment.deleteMany({ orgId: ctx.orgId, groupId: group._id });
  await Group.deleteOne({ _id: group._id });
}

export async function enrollStudents(
  ctx: MemberCtx,
  groupId: string,
  studentIds: string[],
): Promise<Array<{ studentId: string; status: "enrolled" | "already" | "not_allowed"; reason?: string }>> {
  requirePerm(ctx, "enrollment:manage");
  if (!Types.ObjectId.isValid(groupId)) throw new Error("NOT_FOUND");
  await connectDB();
  const group = await Group.findOne({ _id: groupId, orgId: ctx.orgId }).lean();
  if (!group) throw new Error("NOT_FOUND");
  const validIds = studentIds.filter((s) => Types.ObjectId.isValid(s));
  const students = await Student.find({
    _id: { $in: validIds.map((s) => new Types.ObjectId(s)) },
    orgId: ctx.orgId,
    branchId: group.branchId,
    status: "active",
  }).lean();
  const foundIds = new Set(students.map((s) => String(s._id)));
  const alreadySet = new Set(
    (
      await Enrollment.find({
        orgId: ctx.orgId,
        groupId: group._id,
        studentId: { $in: [...foundIds] },
        status: "active",
      }).select("studentId")
    ).map((e) => String(e.studentId)),
  );
  const results: Array<{ studentId: string; status: "enrolled" | "already" | "not_allowed"; reason?: string }> = [];
  for (const sid of studentIds) {
    if (!Types.ObjectId.isValid(sid) || !foundIds.has(sid)) {
      results.push({ studentId: sid, status: "not_allowed", reason: "طالب غير نشط أو ليس في هذا الفرع" });
      continue;
    }
    if (alreadySet.has(sid)) {
      results.push({ studentId: sid, status: "already", reason: "مسجل بالفعل في هذه المجموعة" });
      continue;
    }
    await Enrollment.create({
      orgId: ctx.orgId,
      branchId: group.branchId,
      studentId: new Types.ObjectId(sid),
      groupId: group._id,
      programKey: group.programKey,
      status: "active",
      joinedAt: new Date(),
      leftAt: null,
    });
    results.push({ studentId: sid, status: "enrolled" });
  }
  return results;
}

export async function removeStudent(groupId: string, studentId: string): Promise<void> {
  await connectDB();
  if (!Types.ObjectId.isValid(groupId) || !Types.ObjectId.isValid(studentId)) throw new Error("NOT_FOUND");
  const enrollment = await Enrollment.findOne({ groupId, studentId, status: "active" });
  if (!enrollment) throw new Error("NOT_FOUND");
  enrollment.status = "left";
  enrollment.leftAt = new Date();
  await enrollment.save();
}

export interface StudentSearchResult {
  studentId: string;
  name: string;
  level: string;
  phone: string | null;
  guardianPhone: string | null;
  registeredIn: string[]; // أسماء مجموعاته النشطة في نفس البرنامج
}

export async function searchStudentsForGroup(
  ctx: MemberCtx,
  { groupId, programKey, q }: { groupId?: string; programKey: string; q: string },
): Promise<StudentSearchResult[]> {
  requirePerm(ctx, "enrollment:manage");
  if (!validProgramKey(programKey)) throw new Error("VALIDATION: برنامج غير صالح");
  await connectDB();
  let branchId: Types.ObjectId | null = null;
  if (groupId) {
    if (!Types.ObjectId.isValid(groupId)) throw new Error("NOT_FOUND");
    const group = await Group.findOne({ _id: groupId, orgId: ctx.orgId }).select("_id branchId programKey").lean();
    if (!group) throw new Error("NOT_FOUND");
    branchId = group.branchId;
    if (!validProgramKey(group.programKey)) throw new Error("VALIDATION: برنامج غير صالح");
    // استخدم برنامج المجموعة إذا لم يُمرّر programKey بشكل صريح أو إذا تطابق
  }
  const filter: Record<string, unknown> = { orgId: ctx.orgId, status: "active" };
  if (branchId) filter.branchId = branchId;
  const trimmed = (q ?? "").trim();
  if (trimmed) {
    filter.nameSearch = new RegExp(escapeRegex(normalizeArabic(trimmed)), "i");
  }
  const students = await Student.find(filter)
    .sort({ name: 1 })
    .limit(20)
    .lean();
  const studentIds = students.map((s) => s._id);
  // التسجيلات النشطة لهؤلاء الطلاب في نفس البرنامج
  const enrollments = await Enrollment.find({
    orgId: ctx.orgId,
    studentId: { $in: studentIds },
    programKey,
    status: "active",
  }).lean();
  const enrollByStudent = new Map<string, Types.ObjectId[]>();
  for (const e of enrollments) {
    const arr = enrollByStudent.get(String(e.studentId)) ?? [];
    arr.push(e.groupId);
    enrollByStudent.set(String(e.studentId), arr);
  }
  const enrolledInGroup = new Set(
    (
      await Enrollment.find({
        orgId: ctx.orgId,
        groupId: groupId ? new Types.ObjectId(groupId) : null,
        studentId: { $in: studentIds },
        status: "active",
      }).select("studentId")
    ).map((e) => String(e.studentId)),
  );
  // أسماء المجموعات المسجلة
  const groupIds = [...new Set(enrollments.flatMap((e) => e.groupId))];
  const groupNames = new Map(
    (
      await Group.find({ _id: { $in: groupIds }, orgId: ctx.orgId }).select("_id name").lean()
    ).map((g) => [String(g._id), g.name]),
  );
  return students
    .filter((s) => !enrolledInGroup.has(String(s._id)))
    .map((s) => {
      const groups = (enrollByStudent.get(String(s._id)) ?? [])
        .map((gid) => groupNames.get(String(gid)))
        .filter((g): g is string => g != null);
      return {
        studentId: String(s._id),
        name: s.name,
        level: s.level,
        phone: s.phone,
        guardianPhone: (s.guardians?.[0]?.phone ?? null) ?? null,
        registeredIn: groups,
      };
    });
}

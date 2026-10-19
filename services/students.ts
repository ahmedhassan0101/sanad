// خدمات الطلاب: عزل دائم بـ scopedFilter، وfindOne({_id, orgId}) للقراءة المفردة.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Branch } from "@/db/models/Branch";
import { Group } from "@/db/models/Group";
import { Student } from "@/db/models/Student";
import { Teacher } from "@/db/models/Teacher";
import { Enrollment } from "@/db/models/Enrollment";
import { ProgressReport } from "@/db/models/ProgressReport";
import { generateCode } from "@/lib/invite-code";
import { can, type Action } from "@/lib/permissions/roles";
import { deleteStudentImage } from "@/lib/cloudinary";
import { incompleteFilter, normalizeArabic } from "@/lib/students";
import { COLUMN_AR, toCreateInput } from "@/lib/excel-import";
import type { SessionContext } from "@/lib/tenant/context";
import { scopedFilter } from "@/lib/tenant/scopedFilter";
import { createStudentSchema, toBirthDate, type CreateStudentInput, type UpdateStudentInput } from "@/validators/students";
import { ACTIVITIES_CATALOG } from "@/lib/programs";
import { validationError, forbiddenError, notFoundError } from "@/lib/app-error";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

function requirePerm(ctx: MemberCtx, action: Action) {
  if (!can(ctx.role, action)) throw forbiddenError("لا صلاحية لديك");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// الفرع من النطاق على السيرفر: مُعطى فيُتحقق، وحيد فيُعيَّن تلقائيًا.
async function resolveBranch(ctx: MemberCtx, branchId?: string): Promise<Types.ObjectId> {
  await connectDB();
  const branches = await Branch.find({ orgId: ctx.orgId, status: "active" })
    .select("_id")
    .lean();
  const inScope = (id: Types.ObjectId) =>
    ctx.branchScope.mode === "all" || ctx.branchScope.branchIds.some((b) => b.equals(id));
  if (branchId) {
    if (!Types.ObjectId.isValid(branchId)) throw validationError("الفرع غير صحيح");
    const found = branches.find((b) => String(b._id) === branchId);
    if (!found || !inScope(found._id)) throw forbiddenError("فرع خارج نطاقك");
    return found._id;
  }
  if (branches.length === 1 && inScope(branches[0]!._id)) return branches[0]!._id;
  throw validationError("اختر الفرع");
}

async function uniqueParentCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateCode(10);
    if (!(await Student.exists({ parentCode: code }))) return code;
  }
  throw validationError("تعذر توليد كود فريد");
}

export interface StudentListQuery {
  q?: string;
  level?: string;
  gender?: string;
  status?: string;
  incomplete?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listStudents(ctx: MemberCtx, query: StudentListQuery) {
  requirePerm(ctx, "student:report");
  await connectDB();
  const { q = "", level, gender, status = "active", incomplete, page = 1, pageSize = 20 } = query;
  const filter: Record<string, unknown> = { ...scopedFilter(ctx), status };
  if (level) filter.level = level;
  if (gender) filter.gender = gender;
  const trimmed = q.trim();
  if (trimmed) {
    if (/^[+\d][\d\s+]*$/.test(trimmed)) {
      const rx = new RegExp(escapeRegex(trimmed.replace(/\s+/g, "")), "i");
      filter.$or = [{ phone: rx }, { "guardians.phone": rx }];
    } else {
      filter.nameSearch = new RegExp(escapeRegex(normalizeArabic(trimmed)), "i");
    }
  }
  if (incomplete) Object.assign(filter, incompleteFilter());
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 100);
  const [items, total] = await Promise.all([
    Student.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeSize)
      .limit(safeSize)
      .lean(),
    Student.countDocuments(filter),
  ]);
  const studentIds = items.map((s) => s._id);
  const enrollments = await Enrollment.find({
    orgId: ctx.orgId,
    studentId: { $in: studentIds },
    status: "active",
  }).lean();
  const groupIds = [...new Set(enrollments.map((e) => e.groupId))];
  const groups = await Group.find({ _id: { $in: groupIds }, orgId: ctx.orgId }).select("_id name activityKey").lean();
  const groupMap = new Map(groups.map((g) => [String(g._id), g]));
  const activityMap = new Map<string, string>(ACTIVITIES_CATALOG.map((a) => [a.key, a.name]));
  const enrollByStudent = new Map<string, Array<{ activityKey: string; activityName: string; groupName: string }>>();
  for (const e of enrollments) {
    const g = groupMap.get(String(e.groupId));
    const arr = enrollByStudent.get(String(e.studentId)) ?? [];
    arr.push({
      activityKey: e.activityKey,
      activityName: activityMap.get(e.activityKey) ?? e.activityKey,
      groupName: g?.name ?? "",
    });
    enrollByStudent.set(String(e.studentId), arr);
  }
  const enrichedItems = items.map((s) => ({ ...s, enrollments: enrollByStudent.get(String(s._id)) ?? [] }));
  return { items: enrichedItems, total, page: safePage, pageSize: safeSize };
}

export async function getStudent(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:report");
  if (!Types.ObjectId.isValid(id)) throw notFoundError();
  await connectDB();
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId }).lean();
  if (!student) throw notFoundError();
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw notFoundError();
  }
  const enrollments = await Enrollment.find({ orgId: ctx.orgId, studentId: student._id, status: "active" }).lean();
  const pastEnrollments = await Enrollment.find({ orgId: ctx.orgId, studentId: student._id, status: "left" }).sort({ leftAt: -1 }).lean();
  const groupIds = [...new Set([...enrollments, ...pastEnrollments].map((e) => e.groupId))];
  const groups = await Group.find({ _id: { $in: groupIds }, orgId: ctx.orgId }).lean();
  const groupMap = new Map(groups.map((g) => [String(g._id), g]));
  const teacherIds = [...new Set(groups.filter((g) => g.teacherId).map((g) => g.teacherId))];
  const teachers = teacherIds.length ? await Teacher.find({ _id: { $in: teacherIds }, orgId: ctx.orgId }).select("_id name").lean() : [];
  const teacherMap = new Map(teachers.map((t) => [String(t._id), t.name]));
  const activityMap = new Map<string, string>(ACTIVITIES_CATALOG.map((a) => [a.key, a.name]));
  const enrich = (e: { groupId: Types.ObjectId; activityKey: string; status: string; joinedAt: Date | null; leftAt: Date | null }) => {
    const g = groupMap.get(String(e.groupId));
    return {
      groupId: String(e.groupId),
      groupName: g?.name ?? "",
      activityKey: e.activityKey,
      activityName: activityMap.get(e.activityKey) ?? e.activityKey,
      teacherName: g?.teacherId ? (teacherMap.get(String(g.teacherId)) ?? null) : null,
      status: e.status,
      joinedAt: e.joinedAt,
      leftAt: e.leftAt,
    };
  };
  return {
    ...student,
    enrollments: enrollments.map(enrich),
    pastEnrollments: pastEnrollments.map(enrich),
  };
}

export async function getStudentStats(ctx: MemberCtx) {
  requirePerm(ctx, "student:report");
  await connectDB();
  const base = scopedFilter(ctx);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [active, incomplete, addedThisMonth, archived] = await Promise.all([
    Student.countDocuments({ ...base, status: "active" }),
    Student.countDocuments({ ...base, status: "active", ...incompleteFilter() }),
    Student.countDocuments({ ...base, createdAt: { $gte: monthStart } }),
    Student.countDocuments({ ...base, status: "archived" }),
  ]);
  return { active, incomplete, addedThisMonth, archived };
}

async function findDuplicate(orgId: Types.ObjectId, branchId: Types.ObjectId, nameSearch: string, excludeId?: string) {
  return Student.findOne({
    orgId,
    branchId,
    nameSearch,
    status: "active",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select("_id name")
    .lean();
}

export type CreateStudentResult =
  | { status: "created"; id: string }
  | { status: "duplicate"; duplicate: { id: string; name: string } };

// النواة المشتركة للإدخال الواحد والجماعي: مدخلات متحقق منها + فرع محلول.
async function insertStudentDoc(
  ctx: MemberCtx,
  branchId: Types.ObjectId,
  input: CreateStudentInput,
) {
  const nameSearch = normalizeArabic(input.name);
  const hifz = input.hifz ? { surah: input.hifz.surah, ayah: input.hifz.ayah } : null;
  return Student.create({
    orgId: ctx.orgId,
    branchId,
    name: input.name.trim(),
    nameSearch,
    gender: input.gender,
    level: input.level,
    birthDate: toBirthDate(input.birthDate),
    phone: input.phone || null,
    address: input.address || null,
    notes: input.notes || null,
    guardians: input.guardians,
    image: input.image ?? null,
    hifzStart: hifz,
    hifzPosition: hifz,
    parentCode: await uniqueParentCode(),
  });
}

export async function createStudent(ctx: MemberCtx, input: CreateStudentInput): Promise<CreateStudentResult> {
  requirePerm(ctx, "student:create");
  const branchId = await resolveBranch(ctx, input.branchId);
  const nameSearch = normalizeArabic(input.name);
  const dup = await findDuplicate(ctx.orgId, branchId, nameSearch);
  if (dup && !input.confirmDuplicate) {
    return { status: "duplicate", duplicate: { id: String(dup._id), name: dup.name } };
  }
  const student = await insertStudentDoc(ctx, branchId, input);
  return { status: "created", id: String(student._id) };
}

export interface BulkRowResult {
  index: number;
  status: "saved" | "duplicate" | "invalid";
  errors: string[];
  duplicate?: { id: string; name: string };
  id?: string;
}

export interface PreviewRow {
  excelRow: number;
  status: "valid" | "duplicate" | "invalid";
  errors: { column: string; message: string }[];
  data: Record<string, unknown>;
  duplicate?: { id: string; name: string };
}

// معاينة بدون كتابة: تحقق كامل + فحص تكرار، وتُستخدم نتيجتها للحفظ أيضًا.
export async function previewBulkImport(
  ctx: MemberCtx,
  cleanedRows: { excelRow: number; data: Record<string, unknown> }[],
  opts: { branchId?: string } = {},
): Promise<PreviewRow[]> {
  requirePerm(ctx, "student:import");
  const branchId = await resolveBranch(ctx, opts.branchId);
  const seenInBatch = new Set<string>();
  const out: PreviewRow[] = [];
  for (const row of cleanedRows) {
    const { input, errors } = toCreateInput(row.data);
    const rowErrors = [...errors];
    const parsed = createStudentSchema.safeParse(input);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "");
        const column =
          key === "guardians"
            ? issue.path.join(".").endsWith("relation")
              ? "صلة القرابة"
              : "هاتف ولي الأمر"
            : (COLUMN_AR[key] ?? key);
        rowErrors.push({ column, message: issue.message });
      }
    }
    if (rowErrors.length === 0 && parsed.success) {
      const nameSearch = normalizeArabic(parsed.data.name);
      const dbDup = await findDuplicate(ctx.orgId, branchId, nameSearch);
      if (seenInBatch.has(nameSearch) || dbDup) {
        out.push({
          excelRow: row.excelRow,
          status: "duplicate",
          errors: [],
          data: row.data,
          duplicate: dbDup ? { id: String(dbDup._id), name: dbDup.name } : { id: "", name: parsed.data.name },
        });
        continue;
      }
      seenInBatch.add(nameSearch);
    }
    out.push({
      excelRow: row.excelRow,
      status: rowErrors.length > 0 ? "invalid" : "valid",
      errors: rowErrors,
      data: row.data,
    });
  }
  return out;
}

const MAX_BULK_ROWS = 500;

// إدخال جماعي: نفس قواعد الأحادي، صف واحد فاشل لا يمنع الباقي.
export async function createStudentsBulk(
  ctx: MemberCtx,
  rows: unknown[],
  opts: { branchId?: string; confirmDuplicateRows?: number[] } = {},
): Promise<BulkRowResult[]> {
  requirePerm(ctx, "student:import");
  if (!Array.isArray(rows)) throw validationError("صفوف غير صالحة");
  if (rows.length > MAX_BULK_ROWS) throw validationError("الحد الأقصى 500 صف");
  const branchId = await resolveBranch(ctx, opts.branchId);
  const confirmed = new Set(opts.confirmDuplicateRows ?? []);
  const seenInBatch = new Map<string, number>();
  const results: BulkRowResult[] = [];
  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index] as Record<string, unknown>;
    const { input, errors: logicErrors } = toCreateInput(
      typeof raw === "object" && raw !== null ? raw : {},
    );
    if (logicErrors.length > 0) {
      results.push({
        index,
        status: "invalid",
        errors: logicErrors.map((e) => `${e.column}: ${e.message}`),
      });
      continue;
    }
    const parsed = createStudentSchema.safeParse(input);
    if (!parsed.success) {
      results.push({
        index,
        status: "invalid",
        errors: parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`),
      });
      continue;
    }
    const nameSearch = normalizeArabic(parsed.data.name);
    const batchDupIndex = seenInBatch.get(nameSearch);
    const dbDup = await findDuplicate(ctx.orgId, branchId, nameSearch);
    const dup = batchDupIndex !== undefined || dbDup;
    if (dup && !confirmed.has(index)) {
      const info = batchDupIndex !== undefined
        ? { id: "", name: parsed.data.name }
        : { id: String(dbDup!._id), name: dbDup!.name };
      results.push({ index, status: "duplicate", errors: [], duplicate: info });
      continue;
    }
    seenInBatch.set(nameSearch, index);
    const student = await insertStudentDoc(ctx, branchId, parsed.data);
    results.push({ index, status: "saved", errors: [], id: String(student._id) });
  }
  return results;
}

export async function updateStudent(ctx: MemberCtx, id: string, input: UpdateStudentInput) {
  requirePerm(ctx, "student:edit");
  await connectDB();
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw notFoundError();
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw notFoundError();
  }
  const nameSearch = normalizeArabic(input.name);
  const dup = await findDuplicate(ctx.orgId, student.branchId, nameSearch, id);
  if (dup && !input.confirmDuplicate) {
    return { status: "duplicate", duplicate: { id: String(dup._id), name: dup.name } } as const;
  }
  student.name = input.name.trim();
  student.nameSearch = nameSearch;
  student.gender = input.gender;
  student.level = input.level;
  student.birthDate = toBirthDate(input.birthDate);
  student.phone = input.phone || null;
  student.address = input.address || null;
  student.notes = input.notes || null;
  student.guardians = input.guardians;
  if (input.image !== undefined) {
    const old = student.image?.publicId;
    const next = input.image ?? null;
    student.image = next;
    if (old && (!next || next.publicId !== old)) {
      await deleteStudentImage(old);
    }
  }
  if (input.hifzPosition) student.hifzPosition = { ...input.hifzPosition };
  await student.save();
  return { status: "updated", id: String(student._id) } as const;
}

export async function archiveStudent(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:archive");
  await connectDB();
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw notFoundError();
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw notFoundError();
  }
  student.status = "archived";
  student.archivedAt = new Date();
  await student.save();
}

export async function restoreStudent(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:archive");
  await connectDB();
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw notFoundError();
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw notFoundError();
  }
  student.status = "active";
  student.archivedAt = null;
  await student.save();
}

export async function deleteStudentPermanently(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:delete");
  await connectDB();
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw notFoundError();
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw notFoundError();
  }
  if (student.status !== "archived") throw validationError("احذف المؤرشف فقط — أرشف الطالب أولًا");
  const publicId = student.image?.publicId;
  await ProgressReport.deleteMany({ studentId: student._id, orgId: ctx.orgId });
  await Enrollment.deleteMany({ studentId: student._id, orgId: ctx.orgId });
  await Student.deleteOne({ _id: student._id });
  if (publicId) await deleteStudentImage(publicId);
}

export async function regenerateParentCode(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:edit");
  await connectDB();
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw notFoundError();
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw notFoundError();
  }
  student.parentCode = await uniqueParentCode();
  await student.save();
  return { parentCode: student.parentCode };
}

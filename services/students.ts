// خدمات الطلاب: عزل دائم بـ scopedFilter، وfindOne({_id, orgId}) للقراءة المفردة.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Branch } from "@/db/models/Branch";
import { Student } from "@/db/models/Student";
import { ProgressReport } from "@/db/models/ProgressReport";
import { generateCode } from "@/lib/invite-code";
import { can, type Action } from "@/lib/permissions/roles";
import { deleteStudentImage } from "@/lib/cloudinary";
import { cleanPhone, incompleteFilter, normalizeArabic } from "@/lib/students";
import type { SessionContext } from "@/lib/tenant/context";
import { scopedFilter } from "@/lib/tenant/scopedFilter";
import { createStudentSchema, toBirthDate, type CreateStudentInput, type UpdateStudentInput } from "@/validators/students";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

function requirePerm(ctx: MemberCtx, action: Action) {
  if (!can(ctx.role, action)) throw new Error("FORBIDDEN: لا صلاحية لديك");
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
    if (!Types.ObjectId.isValid(branchId)) throw new Error("VALIDATION: الفرع غير صحيح");
    const found = branches.find((b) => String(b._id) === branchId);
    if (!found || !inScope(found._id)) throw new Error("FORBIDDEN: فرع خارج نطاقك");
    return found._id;
  }
  if (branches.length === 1 && inScope(branches[0]!._id)) return branches[0]!._id;
  throw new Error("VALIDATION: اختر الفرع");
}

async function uniqueParentCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateCode(10);
    if (!(await Student.exists({ parentCode: code }))) return code;
  }
  throw new Error("RETRY: تعذر توليد كود فريد");
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
  return { items, total, page: safePage, pageSize: safeSize };
}

export async function getStudent(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:report");
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId }).lean();
  if (!student) throw new Error("NOT_FOUND");
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw new Error("NOT_FOUND");
  }
  return student;
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

const MAX_BULK_ROWS = 500;

// إدخال جماعي: نفس قواعد الأحادي، صف واحد فاشل لا يمنع الباقي.
export async function createStudentsBulk(
  ctx: MemberCtx,
  rows: unknown[],
  opts: { branchId?: string; confirmDuplicateRows?: number[] } = {},
): Promise<BulkRowResult[]> {
  requirePerm(ctx, "student:import");
  if (!Array.isArray(rows)) throw new Error("VALIDATION: صفوف غير صالحة");
  if (rows.length > MAX_BULK_ROWS) throw new Error("VALIDATION: الحد الأقصى 500 صف");
  const branchId = await resolveBranch(ctx, opts.branchId);
  const confirmed = new Set(opts.confirmDuplicateRows ?? []);
  const seenInBatch = new Map<string, number>();
  const results: BulkRowResult[] = [];
  for (let index = 0; index < rows.length; index++) {
    const raw = rows[index] as Record<string, unknown>;
    const cleaned = {
      ...(typeof raw === "object" && raw !== null ? raw : {}),
      phone: cleanPhone((raw as Record<string, unknown>)?.phone),
      guardians: Array.isArray((raw as Record<string, unknown>)?.guardians)
        ? ((raw as Record<string, unknown>).guardians as Record<string, unknown>[]).map((g) => ({
            ...g,
            phone: cleanPhone(g?.phone),
          }))
        : [],
    };
    const parsed = createStudentSchema.safeParse(cleaned);
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
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw new Error("NOT_FOUND");
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw new Error("NOT_FOUND");
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
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw new Error("NOT_FOUND");
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw new Error("NOT_FOUND");
  }
  student.status = "archived";
  student.archivedAt = new Date();
  await student.save();
}

export async function restoreStudent(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:archive");
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw new Error("NOT_FOUND");
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw new Error("NOT_FOUND");
  }
  student.status = "active";
  student.archivedAt = null;
  await student.save();
}

export async function deleteStudentPermanently(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:delete");
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw new Error("NOT_FOUND");
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw new Error("NOT_FOUND");
  }
  if (student.status !== "archived") throw new Error("VALIDATION: احذف المؤرشف فقط — أرشف الطالب أولًا");
  const publicId = student.image?.publicId;
  await ProgressReport.deleteMany({ studentId: student._id, orgId: ctx.orgId });
  await Student.deleteOne({ _id: student._id });
  if (publicId) await deleteStudentImage(publicId);
}

export async function regenerateParentCode(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "student:edit");
  const student = await Student.findOne({ _id: id, orgId: ctx.orgId });
  if (!student) throw new Error("NOT_FOUND");
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(student.branchId))) {
    throw new Error("NOT_FOUND");
  }
  student.parentCode = await uniqueParentCode();
  await student.save();
  return { parentCode: student.parentCode };
}

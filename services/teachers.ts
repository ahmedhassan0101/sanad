// خدمات المعلمين: عزل دائم بـ scopedFilter، وfindOne({_id, orgId}) للقراءة المفردة.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Branch } from "@/db/models/Branch";
import { Teacher } from "@/db/models/Teacher";
import { can, type Action } from "@/lib/permissions/roles";
import { deleteStudentImage } from "@/lib/cloudinary";
import { normalizeArabic } from "@/lib/students";
import type { SessionContext } from "@/lib/tenant/context";
import { scopedFilter } from "@/lib/tenant/scopedFilter";
import type { CreateTeacherInput, UpdateTeacherInput } from "@/validators/teachers";

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

function inScopeOrThrow(ctx: MemberCtx, branchId: Types.ObjectId) {
  if (ctx.branchScope.mode === "list" && !ctx.branchScope.branchIds.some((b) => b.equals(branchId))) {
    throw new Error("NOT_FOUND");
  }
}

export interface TeacherListQuery {
  q?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}

export async function listTeachers(ctx: MemberCtx, query: TeacherListQuery) {
  requirePerm(ctx, "teacher:create");
  await connectDB();
  const { q = "", status = "active", page = 1, pageSize = 20 } = query;
  const filter: Record<string, unknown> = { ...scopedFilter(ctx), status };
  const trimmed = q.trim();
  if (trimmed) {
    if (/^[+\d][\d\s+]*$/.test(trimmed)) {
      filter.phone = new RegExp(escapeRegex(trimmed.replace(/\s+/g, "")), "i");
    } else {
      filter.nameSearch = new RegExp(escapeRegex(normalizeArabic(trimmed)), "i");
    }
  }
  const safePage = Math.max(1, page);
  const safeSize = Math.min(Math.max(1, pageSize), 100);
  const [items, total] = await Promise.all([
    Teacher.find(filter)
      .sort({ createdAt: -1 })
      .skip((safePage - 1) * safeSize)
      .limit(safeSize)
      .lean(),
    Teacher.countDocuments(filter),
  ]);
  return { items, total, page: safePage, pageSize: safeSize };
}

export async function getTeacher(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "teacher:create");
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const teacher = await Teacher.findOne({ _id: id, orgId: ctx.orgId }).lean();
  if (!teacher) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, teacher.branchId);
  return teacher;
}

export async function getTeacherStats(ctx: MemberCtx) {
  requirePerm(ctx, "teacher:create");
  await connectDB();
  const base = scopedFilter(ctx);
  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const [active, archived, addedThisMonth] = await Promise.all([
    Teacher.countDocuments({ ...base, status: "active" }),
    Teacher.countDocuments({ ...base, status: "archived" }),
    Teacher.countDocuments({ ...base, createdAt: { $gte: monthStart } }),
  ]);
  return { active, archived, addedThisMonth };
}

async function findDuplicate(orgId: Types.ObjectId, branchId: Types.ObjectId, nameSearch: string, excludeId?: string) {
  return Teacher.findOne({
    orgId,
    branchId,
    nameSearch,
    status: "active",
    ...(excludeId ? { _id: { $ne: excludeId } } : {}),
  })
    .select("_id name")
    .lean();
}

export type CreateTeacherResult =
  | { status: "created"; id: string }
  | { status: "duplicate"; duplicate: { id: string; name: string } };

export async function createTeacher(ctx: MemberCtx, input: CreateTeacherInput): Promise<CreateTeacherResult> {
  requirePerm(ctx, "teacher:create");
  const branchId = await resolveBranch(ctx, input.branchId);
  const nameSearch = normalizeArabic(input.name);
  const dup = await findDuplicate(ctx.orgId, branchId, nameSearch);
  if (dup && !input.confirmDuplicate) {
    return { status: "duplicate", duplicate: { id: String(dup._id), name: dup.name } };
  }
  const teacher = await Teacher.create({
    orgId: ctx.orgId,
    branchId,
    name: input.name.trim(),
    nameSearch,
    phone: input.phone || null,
    notes: input.notes || null,
    image: input.image ?? null,
  });
  return { status: "created", id: String(teacher._id) };
}

export async function updateTeacher(ctx: MemberCtx, id: string, input: UpdateTeacherInput) {
  requirePerm(ctx, "teacher:edit");
  const teacher = await Teacher.findOne({ _id: id, orgId: ctx.orgId });
  if (!teacher) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, teacher.branchId);
  const nameSearch = normalizeArabic(input.name);
  const dup = await findDuplicate(ctx.orgId, teacher.branchId, nameSearch, id);
  if (dup && !input.confirmDuplicate) {
    return { status: "duplicate", duplicate: { id: String(dup._id), name: dup.name } } as const;
  }
  teacher.name = input.name.trim();
  teacher.nameSearch = nameSearch;
  teacher.phone = input.phone || null;
  teacher.notes = input.notes || null;
  if (input.image !== undefined) {
    const old = teacher.image?.publicId;
    const next = input.image ?? null;
    teacher.image = next;
    if (old && (!next || next.publicId !== old)) {
      await deleteStudentImage(old);
    }
  }
  await teacher.save();
  return { status: "updated", id: String(teacher._id) } as const;
}

export async function archiveTeacher(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "teacher:archive");
  const teacher = await Teacher.findOne({ _id: id, orgId: ctx.orgId });
  if (!teacher) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, teacher.branchId);
  teacher.status = "archived";
  teacher.archivedAt = new Date();
  await teacher.save();
}

export async function restoreTeacher(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "teacher:archive");
  const teacher = await Teacher.findOne({ _id: id, orgId: ctx.orgId });
  if (!teacher) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, teacher.branchId);
  teacher.status = "active";
  teacher.archivedAt = null;
  await teacher.save();
}

export async function deleteTeacherPermanently(ctx: MemberCtx, id: string) {
  requirePerm(ctx, "teacher:delete");
  const teacher = await Teacher.findOne({ _id: id, orgId: ctx.orgId });
  if (!teacher) throw new Error("NOT_FOUND");
  inScopeOrThrow(ctx, teacher.branchId);
  if (teacher.status !== "archived") throw new Error("VALIDATION: احذف المؤرشف فقط — أرشف المعلم أولًا");
  const publicId = teacher.image?.publicId;
  await Teacher.deleteOne({ _id: teacher._id });
  if (publicId) await deleteStudentImage(publicId);
}

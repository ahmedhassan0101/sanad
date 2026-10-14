// خدمات الفروع: إنشاء/تعديل/أرشفة لمدير المركز فقط + عدد المحتويات.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
import { Teacher } from "@/db/models/Teacher";
import { can } from "@/lib/permissions/roles";
import type { SessionContext } from "@/lib/tenant/context";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

function requireManager(ctx: MemberCtx) {
  if (!can(ctx.role, "branch:create")) throw new Error("FORBIDDEN: إدارة الفروع لمدير المركز فقط");
}

function cleanName(name: string) {
  const trimmed = name.trim().replace(/\s+/g, " ");
  if (trimmed.length < 2) throw new Error("VALIDATION: اسم الفرع قصير جدًا");
  if (trimmed.length > 60) throw new Error("VALIDATION: اسم الفرع طويل جدًا");
  return trimmed;
}

export async function listBranchesWithCounts(ctx: MemberCtx) {
  requireManager(ctx);
  await connectDB();
  const branches = await Branch.find({ orgId: ctx.orgId }).sort({ name: 1 }).lean();
  return Promise.all(
    branches.map(async (b) => {
      const [students, teachers, members] = await Promise.all([
        Student.countDocuments({ orgId: ctx.orgId, branchId: b._id, status: "active" }),
        Teacher.countDocuments({ orgId: ctx.orgId, branchId: b._id, status: "active" }),
        Membership.countDocuments({ orgId: ctx.orgId, branchIds: b._id, status: "active" }),
      ]);
      return { id: String(b._id), name: b.name, status: b.status, students, teachers, members };
    }),
  );
}

export async function createBranch(ctx: MemberCtx, name: string) {
  requireManager(ctx);
  const clean = cleanName(name);
  await connectDB();
  try {
    const branch = await Branch.create({ orgId: ctx.orgId, name: clean });
    return { id: String(branch._id) };
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: number }).code === 11000) {
      throw new Error("VALIDATION: يوجد فرع بهذا الاسم بالفعل");
    }
    throw e;
  }
}

export async function renameBranch(ctx: MemberCtx, id: string, name: string) {
  requireManager(ctx);
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  const clean = cleanName(name);
  await connectDB();
  const branch = await Branch.findOne({ _id: id, orgId: ctx.orgId });
  if (!branch) throw new Error("NOT_FOUND");
  branch.name = clean;
  try {
    await branch.save();
  } catch (e) {
    if (e instanceof Error && "code" in e && (e as { code: number }).code === 11000) {
      throw new Error("VALIDATION: يوجد فرع بهذا الاسم بالفعل");
    }
    throw e;
  }
}

export async function archiveBranch(ctx: MemberCtx, id: string) {
  requireManager(ctx);
  if (!Types.ObjectId.isValid(id)) throw new Error("NOT_FOUND");
  await connectDB();
  const branch = await Branch.findOne({ _id: id, orgId: ctx.orgId });
  if (!branch) throw new Error("NOT_FOUND");
  const [students, teachers, members] = await Promise.all([
    Student.countDocuments({ orgId: ctx.orgId, branchId: branch._id, status: "active" }),
    Teacher.countDocuments({ orgId: ctx.orgId, branchId: branch._id, status: "active" }),
    Membership.countDocuments({ orgId: ctx.orgId, branchIds: branch._id, status: "active" }),
  ]);
  if (students > 0 || teachers > 0 || members > 0) {
    throw new Error(
      `VALIDATION: لا يمكن أرشفة الفرع — به ${students} طالب و${teachers} معلم و${members} عضو نشط. انقلهم أولًا`,
    );
  }
  branch.status = "archived";
  await branch.save();
}

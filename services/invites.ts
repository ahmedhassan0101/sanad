// الدعوات: إنشاء كود لمرة واحدة، وقبوله بفحص ذري مع كل الصلاحيات.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Branch } from "@/db/models/Branch";
import { Invite } from "@/db/models/Invite";
import { Membership, type MembershipRole } from "@/db/models/Membership";
import { generateInviteCode, hashInviteCode } from "@/lib/invite-code";
import { getEnv } from "@/lib/env";
import { can, rank } from "@/lib/permissions/roles";
import { requireVerifiedUser } from "./auth-accounts";
import { assertBranchesInOrg, assertMembershipShape } from "./memberships";

export async function createInvite(
  granter: { userId: string; orgId: Types.ObjectId; role: MembershipRole; branchIds: Types.ObjectId[] },
  role: MembershipRole,
  branchId: string | null,
  daysValid: number
) {
  await connectDB();
  await requireVerifiedUser(granter.userId);
  if (rank(granter.role) < rank(role)) throw new Error("FORBIDDEN: above own level");
  if (role === "center_admin" && !can(granter.role, "member:invite")) {
    throw new Error("FORBIDDEN");
  }
  const branchObj = branchId ? new Types.ObjectId(branchId) : null;
  if (role !== "center_admin" && !branchObj) throw new Error("VALIDATION: الفرع مطلوب");
  if (branchObj) {
    if (granter.role !== "center_admin" && !granter.branchIds.some((b) => b.equals(branchObj))) {
      throw new Error("FORBIDDEN: خارج فروعك");
    }
    await assertBranchesInOrg(granter.orgId, [branchObj]);
    const br = await Branch.findOne({ _id: branchObj, orgId: granter.orgId });
    if (!br || br.status !== "active") throw new Error("VALIDATION: الفرع غير نشط");
  }
  const activeCount = await Invite.countDocuments({
    orgId: granter.orgId,
    branchId: branchObj,
    usedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  });
  if (activeCount >= 20) throw new Error("FORBIDDEN: وصلت لحد الدعوات النشطة");
  const code = generateInviteCode();
  const env = getEnv();
  const expiresAt = new Date(Date.now() + Math.min(Math.max(daysValid, 1), 7) * 86400_000);
  await Invite.create({
    orgId: granter.orgId,
    branchId: branchObj,
    role,
    codeHash: hashInviteCode(code, env.inviteCodePepper ?? "dev-pepper"),
    expiresAt,
    purgeAt: new Date(expiresAt.getTime() + 30 * 86400_000),
    createdByUserId: new Types.ObjectId(granter.userId),
  });
  return { code };
}

export async function consumeInvite(userId: string, rawCode: string) {
  await connectDB();
  await requireVerifiedUser(userId);
  const env = getEnv();
  const now = new Date();
  const updated = await Invite.findOneAndUpdate(
    {
      codeHash: hashInviteCode(rawCode, env.inviteCodePepper ?? "dev-pepper"),
      usedAt: null,
      revokedAt: null,
      expiresAt: { $gt: now },
    },
    { $set: { usedAt: now, usedByUserId: new Types.ObjectId(userId) } },
    { new: true }
  );
  if (!updated) throw new Error("الكود منتهي أو مستخدم أو غير صحيح");
  // Re-check granter authority at use time (not just at creation).
  const granter = await Membership.findOne({
    userId: updated.createdByUserId,
    orgId: updated.orgId,
    status: "active",
  });
  if (!granter || rank(granter.role) < rank(updated.role)) {
    throw new Error("الدعوة أُلغيت (تغيرت صلاحية الداعي)");
  }
  if (updated.branchId) {
    const br = await Branch.findOne({ _id: updated.branchId, orgId: updated.orgId });
    if (!br || br.status !== "active") throw new Error("الفرع غير نشط");
  }
  const uid = new Types.ObjectId(userId);
  const branchIds = updated.branchId ? [updated.branchId] : [];  assertMembershipShape(updated.role, branchIds as Types.ObjectId[]);
  const existing = await Membership.findOne({ userId: uid, orgId: updated.orgId });
  if (existing) {
    if (existing.status === "active") throw new Error("أنت عضو بالفعل في هذا المركز");
    existing.status = "active";
    existing.role = updated.role;
    existing.branchIds = branchIds as Types.ObjectId[];
    await existing.save();
  } else {
    await Membership.create({
      userId: uid,
      orgId: updated.orgId,
      role: updated.role,
      branchIds,
      invitedByUserId: updated.createdByUserId,
    });
  }
  return { orgId: String(updated.orgId) };
}

type TeamCtx = {
  kind: "member";
  orgId: Types.ObjectId;
  role: MembershipRole;
  branchScope: { mode: "all" } | { mode: "list"; branchIds: Types.ObjectId[] };
};

function requireTeamAccess(ctx: TeamCtx) {
  if (ctx.role !== "center_admin" && ctx.role !== "branch_admin") {
    throw new Error("FORBIDDEN: الفريق للمشرفين فقط");
  }
}

function branchFilter(ctx: TeamCtx) {
  if (ctx.branchScope.mode === "all") return {};
  return { branchId: { $in: ctx.branchScope.branchIds } };
}

// الدعوات الفعّالة فقط (غير مستخدمة وغير منتهية وغير ملغاة)، بالنطاق.
export async function listInvites(ctx: TeamCtx) {
  requireTeamAccess(ctx);
  await connectDB();
  const invites = await Invite.find({
    orgId: ctx.orgId,
    ...branchFilter(ctx),
    usedAt: null,
    revokedAt: null,
    expiresAt: { $gt: new Date() },
  })
    .sort({ createdAt: -1 })
    .lean();
  return invites.map((i) => ({
    id: String(i._id),
    role: i.role,
    branchId: i.branchId ? String(i.branchId) : null,
    expiresAt: i.expiresAt.toISOString(),
  }));
}

export async function revokeInvite(ctx: TeamCtx, inviteId: string) {
  requireTeamAccess(ctx);
  if (!Types.ObjectId.isValid(inviteId)) throw new Error("FORBIDDEN");
  await connectDB();
  const invite = await Invite.findOne({ _id: new Types.ObjectId(inviteId), orgId: ctx.orgId });
  if (!invite || invite.usedAt || invite.revokedAt) throw new Error("NOT_FOUND");
  if (ctx.role === "branch_admin") {
    const mine = ctx.branchScope.mode === "list" ? ctx.branchScope.branchIds : [];
    if (!invite.branchId || !mine.some((b) => b.equals(invite.branchId))) {
      throw new Error("FORBIDDEN: خارج فروعك");
    }
  }
  invite.revokedAt = new Date();
  await invite.save();
  return { ok: true as const };
}

// إدارة الأعضاء: قائمة بالنطاق + تغيير دور/تعطيل بحماية المنشئ وآخر أدمن.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Membership, type MembershipRole } from "@/db/models/Membership";
import { User } from "@/db/models/User";
import type { SessionContext } from "@/lib/tenant/context";
import { scopedFilter } from "@/lib/tenant/scopedFilter";
import { assertBranchesInOrg, assertRankAllows, guardAdminChange } from "./memberships";
import { forbiddenError, notFoundError } from "@/lib/app-error";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

function requireTeamAccess(ctx: MemberCtx) {
  if (ctx.role !== "center_admin" && ctx.role !== "branch_admin") {
    throw forbiddenError("الفريق للمشرفين فقط");
  }
}

export async function listMembers(ctx: MemberCtx) {
  requireTeamAccess(ctx);
  await connectDB();
  const memberships = await Membership.find(scopedFilter(ctx, "branchIds")).sort({ createdAt: 1 }).lean();
  const users = await User.find({ _id: { $in: memberships.map((m) => m.userId) } })
    .select("name email")
    .lean();
  const nameOf = new Map(users.map((u) => [String(u._id), { name: u.name, email: u.email }]));
  return memberships.map((m) => ({
    userId: String(m.userId),
    ...(nameOf.get(String(m.userId)) ?? { name: "", email: "" }),
    role: m.role,
    branchIds: m.branchIds.map(String),
    status: m.status,
  }));
}

export async function updateMember(
  ctx: MemberCtx,
  targetUserId: string,
  patch: { role?: MembershipRole; status?: "active" | "disabled" }
) {
  requireTeamAccess(ctx);
  await connectDB();
  if (!Types.ObjectId.isValid(targetUserId)) throw forbiddenError("غير مسموح");
  const target = await Membership.findOne({ userId: new Types.ObjectId(targetUserId), orgId: ctx.orgId });
  if (!target) throw notFoundError();
  assertRankAllows(ctx.role, target.role);
  if (ctx.role === "branch_admin") {
    const mine = ctx.branchScope.mode === "list" ? ctx.branchScope.branchIds : [];
    const shared = target.branchIds.some((b) => mine.some((x) => x.equals(b)));
    if (!shared) throw forbiddenError("خارج فروعك");
  }
  if (patch.role && patch.role !== target.role) {
    assertRankAllows(ctx.role, patch.role);
    await guardAdminChange(ctx.orgId, target.userId, target.role, target.branchIds[0] ?? null);
    target.role = patch.role;
    await assertBranchesInOrg(ctx.orgId, target.branchIds);
  }
  if (patch.status && patch.status !== target.status) {
    await guardAdminChange(ctx.orgId, target.userId, target.role, target.branchIds[0] ?? null);
    target.status = patch.status;
  }
  await target.save();
  return { ok: true as const };
}

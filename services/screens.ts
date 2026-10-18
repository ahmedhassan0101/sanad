// بيانات الشاشات: الداشبورد (نطاق العضو) + نظرة المنصة (أرقام فقط).
import "server-only";
import { connectDB } from "@/db/connection";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Org } from "@/db/models/Org";
import type { SessionContext } from "@/lib/tenant/context";
import { scopedFilter } from "@/lib/tenant/scopedFilter";

export async function getDashboard(ctx: Extract<SessionContext, { kind: "member" }>) {
  await connectDB();
  const org = await Org.findOne({ _id: ctx.orgId });
  if (!org) throw new Error("NOT_FOUND");
  const branches = await Branch.find(scopedFilter(ctx, "_id")).sort({ name: 1 }).lean();
  return {
    orgName: org.name as string,
    role: ctx.role,
    branches: branches.map((b) => ({ id: String(b._id), name: b.name })),
    programs: [],
  };
}

export async function getPlatformStats() {
  await connectDB();
  const orgs = await Org.find({}).sort({ createdAt: -1 }).lean();
  return Promise.all(
    orgs.map(async (o) => ({
      name: o.name,
      contact: o.contactPhone,
      branches: await Branch.countDocuments({ orgId: o._id }),
      members: await Membership.countDocuments({ orgId: o._id, status: "active" }),
      programs: 0,
    }))
  );
}

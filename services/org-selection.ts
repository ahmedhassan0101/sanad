// اختيار المركز النشط: قائمة عضوياتي + تفعيل واحدة بعد التحقق.
import "server-only";
import { Types } from "mongoose";
import { connectDB } from "@/db/connection";
import { Membership } from "@/db/models/Membership";
import { Org } from "@/db/models/Org";

export async function listMyMemberships(userId: string) {
  await connectDB();
  const memberships = await Membership.find({
    userId: new Types.ObjectId(userId),
    status: "active",
  }).lean();
  const orgs = await Org.find({ _id: { $in: memberships.map((m) => m.orgId) } }).lean();
  const nameOf = new Map(orgs.map((o) => [String(o._id), o.name]));
  return memberships.map((m) => ({
    orgId: String(m.orgId),
    orgName: nameOf.get(String(m.orgId)) ?? "",
    role: m.role,
  }));
}

export async function activateOrg(userId: string, orgId: string) {
  if (!Types.ObjectId.isValid(orgId)) throw new Error("FORBIDDEN");
  await connectDB();
  const m = await Membership.findOne({
    userId: new Types.ObjectId(userId),
    orgId: new Types.ObjectId(orgId),
    status: "active",
  });
  if (!m) throw new Error("FORBIDDEN");
  return { orgId };
}

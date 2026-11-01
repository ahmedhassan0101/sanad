// اختيار المركز النشط: قائمة عضوياتي + تفعيل واحدة بعد التحقق.
import "server-only";
import { Types } from "mongoose";
import { cookies } from "next/headers";
import { connectDB } from "@/db/connection";
import { Membership } from "@/db/models/Membership";
import { Org } from "@/db/models/Org";
import { requireVerifiedUser } from "./auth-accounts";

// مدة كوكي المركز النشط: 30 يومًا.
const ACTIVE_ORG_MAX_AGE = 60 * 60 * 24 * 30;

export function setActiveOrgCookie(orgId: string) {
  return cookies().then((jar) =>
    jar.set("active_org", orgId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACTIVE_ORG_MAX_AGE,
    }),
  );
}

export async function listMyMemberships(userId: string) {
  await connectDB();
  const memberships = await Membership.find({
    userId: new Types.ObjectId(userId),
    status: "active",
  }).lean();
  const orgs = await Org.find({
    _id: { $in: memberships.map((m) => m.orgId) },
  }).lean();
  const nameOf = new Map(orgs.map((o) => [String(o._id), o.name]));
  return memberships.map((m) => ({
    orgId: String(m.orgId),
    orgName: nameOf.get(String(m.orgId)) ?? "",
    role: m.role,
  }));
}

export async function activateOrg(userId: string, orgId: string) {
  if (!Types.ObjectId.isValid(orgId)) throw new Error("FORBIDDEN");
  await requireVerifiedUser(userId);
  await connectDB();
  const m = await Membership.findOne({
    userId: new Types.ObjectId(userId),
    orgId: new Types.ObjectId(orgId),
    status: "active",
  });
  if (!m) throw new Error("FORBIDDEN");
  return { orgId };
}

// قرار ما بعد الدخول: بلا عضويات ← onboarding، واحدة ← تُختار تلقائيًا، أكثر ← select-org.
export async function resolvePostLogin(
  userId: string,
): Promise<
  { kind: "none" } | { kind: "single"; orgId: string } | { kind: "many" }
> {
  const memberships = await listMyMemberships(userId);
  if (memberships.length === 0) return { kind: "none" };
  if (memberships.length === 1)
    return { kind: "single", orgId: memberships[0]!.orgId };
  return { kind: "many" };
}

export async function activateBranchPref(
  userId: string,
  orgId: string,
  branchId: string | null,
) {
  if (branchId !== null && !Types.ObjectId.isValid(branchId))
    throw new Error("FORBIDDEN");
  await requireVerifiedUser(userId);
  await connectDB();
  const m = await Membership.findOne({
    userId: new Types.ObjectId(userId),
    orgId: new Types.ObjectId(orgId),
    status: "active",
  });
  if (!m) throw new Error("FORBIDDEN");
  if (branchId !== null) {
    if (
      m.role !== "center_admin" &&
      !m.branchIds.some((b) => b.equals(new Types.ObjectId(branchId)))
    ) {
      throw new Error("FORBIDDEN: خارج فروعك");
    }
    const { Branch } = await import("@/db/models/Branch");
    const br = await Branch.findOne({
      _id: new Types.ObjectId(branchId),
      orgId: m.orgId,
      status: "active",
    });
    if (!br) throw new Error("NOT_FOUND");
  }
  return { branchId };
}

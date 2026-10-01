import "server-only";
import { Types } from "mongoose";
import { User } from "@/db/models/User";
import { Membership } from "@/db/models/Membership";
import type { SessionContext } from "@/lib/tenant/context";

// Builds context from the DB on every request. JWT carries userId only.
// Three states: platform (stats only) | onboarding (no org yet) | member.
export async function getSessionContext(
  userId: string | null,
  activeOrgId: string | null
): Promise<SessionContext> {
  if (!userId || !Types.ObjectId.isValid(userId)) throw new Error("UNAUTHENTICATED");
  const user = await User.findById(userId).select("status isPlatformAdmin sessionVersion");
  if (!user || user.status !== "active") throw new Error("UNAUTHENTICATED");
  if (user.isPlatformAdmin) return { kind: "platform", userId };
  if (!activeOrgId || !Types.ObjectId.isValid(activeOrgId)) return { kind: "onboarding", userId };
  const membership = await Membership.findOne({
    userId: user._id,
    orgId: new Types.ObjectId(activeOrgId),
    status: "active",
  });
  if (!membership) throw new Error("FORBIDDEN");
  return {
    kind: "member",
    userId,
    orgId: membership.orgId,
    role: membership.role,
    branchScope:
      membership.role === "center_admin"
        ? { mode: "all" }
        : { mode: "list", branchIds: membership.branchIds },
  };
}

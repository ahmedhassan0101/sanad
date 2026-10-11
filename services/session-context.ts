import "server-only";
import { Types } from "mongoose";
import { User } from "@/db/models/User";
import { Membership } from "@/db/models/Membership";
import type { SessionContext } from "@/lib/tenant/context";

// Builds context from the DB on every request. JWT carries userId only.
// Four states: platform (stats only) | onboarding (no org yet) | unverified | member.
export async function getSessionContext(
  userId: string | null,
  activeOrgId: string | null,
  expectedSessionVersion?: number | null,
): Promise<SessionContext> {
  if (!userId || !Types.ObjectId.isValid(userId))
    throw new Error("UNAUTHENTICATED");
  const user = await User.findById(userId).select(
    "status isPlatformAdmin sessionVersion email emailVerifiedAt",
  );
  if (!user || user.status !== "active") throw new Error("UNAUTHENTICATED");
  if (
    expectedSessionVersion !== undefined &&
    expectedSessionVersion !== user.sessionVersion
  ) {
    throw new Error("UNAUTHENTICATED");
  }
  if (user.isPlatformAdmin) return { kind: "platform", userId };
  if (!user.emailVerifiedAt)
    return { kind: "unverified", userId, email: user.email };
  if (!activeOrgId || !Types.ObjectId.isValid(activeOrgId))
    return { kind: "onboarding", userId };
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

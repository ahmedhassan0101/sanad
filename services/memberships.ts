import "server-only";
import type { ClientSession, Types } from "mongoose";
import { Branch } from "@/db/models/Branch";
import { Membership, type MembershipRole } from "@/db/models/Membership";
import { Org } from "@/db/models/Org";
import { rank } from "@/lib/permissions/roles";

// Shape validation for every membership write (schema validators don't run on
// updateOne/findOneAndUpdate, so services enforce this instead).
export function assertMembershipShape(role: MembershipRole, branchIds: Types.ObjectId[]) {
  if ((role === "branch_admin" || role === "teacher") && branchIds.length < 1) {
    throw new Error("VALIDATION: scoped roles require at least one branch");
  }
}

// branchIds must be a subset of the org's branches. Called by membership services (2.2).
export async function assertBranchesInOrg(orgId: Types.ObjectId, branchIds: Types.ObjectId[]) {
  if (branchIds.length === 0) return;
  const count = await Branch.countDocuments({ _id: { $in: branchIds }, orgId });
  if (count !== branchIds.length) throw new Error("VALIDATION: branch outside org");
}

async function countActiveAdmins(
  orgId: Types.ObjectId,
  role: MembershipRole,
  branchId: Types.ObjectId | null,
  session?: ClientSession
) {
  const filter: Record<string, unknown> = { orgId, role, status: "active" };
  if (branchId) filter.branchIds = branchId;
  return Membership.countDocuments(filter).session(session ?? null);
}

// Stateful guard for demote/disable/remove. Static matrix stays in can();
// creator protection + last-admin need DB state, so they live here.
// NOTE (recorded improvement): full write-skew safety needs a shared write
// (Org.adminsVersion bump) inside the same transaction; count-check alone can
// race. Callers must run this inside a transaction in phase 5.
export async function guardAdminChange(
  orgId: Types.ObjectId,
  targetUserId: Types.ObjectId,
  targetRole: MembershipRole,
  targetBranchId: Types.ObjectId | null,
  session?: ClientSession
) {
  const org = await Org.findById(orgId).select("createdByUserId").session(session ?? null);
  if (org && org.createdByUserId.equals(targetUserId)) {
    throw new Error("FORBIDDEN: org creator is protected");
  }
  const remaining = await countActiveAdmins(orgId, targetRole, targetBranchId, session);
  if (remaining <= 1) throw new Error("FORBIDDEN: last admin at this level");
}

// Actor may not touch a higher role than their own.
export function assertRankAllows(actorRole: MembershipRole, targetRole: MembershipRole) {
  if (rank(actorRole) < rank(targetRole)) throw new Error("FORBIDDEN: above own level");
}

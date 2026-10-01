import "server-only";
import { Branch } from "@/db/models/Branch";
import type { SessionContext } from "@/lib/tenant/context";
import { scopedFilter } from "@/lib/tenant/scopedFilter";

// Minimal witness service for isolation tests: lists branches inside the caller's scope.
// Branch identity IS _id here, so scope filters on _id (not branchId).
export async function listBranches(ctx: SessionContext) {
  if (ctx.kind !== "member") throw new Error("FORBIDDEN");
  return Branch.find(scopedFilter(ctx, "_id")).sort({ name: 1 }).lean();
}

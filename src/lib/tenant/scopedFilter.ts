import type { FilterQuery } from "mongoose";
import type { SessionContext } from "@/lib/tenant/context";

// One helper for every tenant read. orgId always comes from the server context.
export function scopedFilter(
  ctx: Extract<SessionContext, { kind: "member" }>,
  branchField = "branchId"
): FilterQuery<Record<string, unknown>> {
  const filter: FilterQuery<Record<string, unknown>> = { orgId: ctx.orgId };
  if (ctx.branchScope.mode === "list") {
    filter[branchField] = { $in: ctx.branchScope.branchIds };
  }
  return filter;
}

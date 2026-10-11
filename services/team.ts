// بيانات صفحة الفريق: ليست أكشن — تُستدعى من الصفحة فقط.
import "server-only";
import { listBranches } from "./branches-read";
import { listInvites } from "./invites";
import { listMembers } from "./members";
import type { SessionContext } from "@/lib/tenant/context";

export async function getTeamData(
  ctx: Extract<SessionContext, { kind: "member" }>,
  pref: string | null,
) {
  if (ctx.role !== "center_admin" && ctx.role !== "branch_admin") {
    throw new Error("FORBIDDEN: لا صلاحية لديك لهذا الإجراء");
  }
  const [branches, members, invites] = await Promise.all([
    listBranches(ctx),
    listMembers(ctx),
    listInvites(ctx),
  ]);
  const validPref = branches.some((b) => String(b._id) === pref) ? pref : null;
  return {
    role: ctx.role,
    branches: branches.map((b) => ({ id: String(b._id), name: b.name })),
    members: validPref
      ? members.filter((m) => m.branchIds.includes(validPref))
      : members,
    invites: validPref
      ? invites.filter((i) => !i.branchId || i.branchId === validPref)
      : invites,
  };
}

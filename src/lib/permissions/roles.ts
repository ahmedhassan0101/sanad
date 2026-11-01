
import type { MembershipRole } from "@/db/models/Membership";

// Single source of truth for roles. No role checks outside can() + membership guards.
export const ROLES = ["center_admin", "branch_admin", "supervisor"] as const;

export type Role = MembershipRole;

// الصلاحيات تراكمية: كل دور أعلى يرث كل ما للدور الأدنى ثم يزيد عليه.
// (as const) يجعل نوع Action يُشتق تلقائيًا، وأي خطأ إملائي يفشل وقت الترجمة.
const SUPERVISOR_ACTIONS = [
  "attendance:write",
  "progress:write",
  "student:create",
  "student:edit",
  "student:archive",
  "student:report",
  "student:import",
  "report:create",
  "report:edit",
  "teacher:create",
  "teacher:edit",
  "teacher:archive",
  "group:create",
  "group:edit",
  "group:archive",
  "enrollment:manage",
] as const;

const BRANCH_ADMIN_ACTIONS = [
  ...SUPERVISOR_ACTIONS,
  "member:invite-teacher",
  "member:disable-teacher",
  "student:delete",
  "report:delete",
  "teacher:delete",
  "group:delete",
] as const;

const CENTER_ADMIN_ACTIONS = [
  ...BRANCH_ADMIN_ACTIONS,
  "branch:create",
  "member:invite",
  "member:change-role",
  "member:disable",
  "settings:manage",
] as const;

export type Action = (typeof CENTER_ADMIN_ACTIONS)[number];

// Static matrix: can this role attempt this action at all (no DB needed).
// Stateful rules (creator protection, last admin) live in services/memberships.ts.
const MATRIX: Record<Role, ReadonlySet<Action>> = {
  center_admin: new Set(CENTER_ADMIN_ACTIONS),
  branch_admin: new Set(BRANCH_ADMIN_ACTIONS),
  supervisor: new Set(SUPERVISOR_ACTIONS),
};

export function can(role: Role, action: Action): boolean {
  return MATRIX[role]?.has(action) ?? false;
}

// Rank for "no one grants above their own level".
export function rank(role: Role): number {
  return role === "center_admin" ? 3 : role === "branch_admin" ? 2 : 1;
}

// import type { MembershipRole } from "@/db/models/Membership";

// // Single source of truth for roles. No role checks outside can() + membership guards.
// export const ROLES = ["center_admin", "branch_admin", "supervisor"] as const;

// export type Role = MembershipRole;

// // Static matrix: can this role attempt this action at all (no DB needed).
// // Stateful rules (creator protection, last admin) live in services/memberships.ts.
// const MATRIX: Record<Role, Set<string>> = {
//   center_admin: new Set([
//     "branch:create",
//     "member:invite",
//     "member:change-role",
//     "member:disable",
//     "settings:manage",
//     "student:create",
//     "student:edit",
//     "student:archive",
//     "student:report",
//     "student:import",
//     "student:delete",
//     "report:create",
//     "report:edit",
//     "report:delete",
//     "teacher:create",
//     "teacher:edit",
//     "teacher:archive",
//     "teacher:delete",
//     "group:create",
//     "group:edit",
//     "group:archive",
//     "group:delete",
//     "enrollment:manage",
//   ]),
//   branch_admin: new Set([
//     "member:invite-teacher",
//     "member:disable-teacher",
//     "student:create",
//     "student:edit",
//     "student:archive",
//     "student:report",
//     "student:import",
//     "student:delete",
//     "report:create",
//     "report:edit",
//     "report:delete",
//     "teacher:create",
//     "teacher:edit",
//     "teacher:archive",
//     "teacher:delete",
//     "group:create",
//     "group:edit",
//     "group:archive",
//     "group:delete",
//     "enrollment:manage",
//   ]),
//   supervisor: new Set([
//     "attendance:write",
//     "progress:write",
//     "student:create",
//     "student:edit",
//     "student:archive",
//     "student:report",
//     "student:import",
//     "report:create",
//     "report:edit",
//     "teacher:create",
//     "teacher:edit",
//     "teacher:archive",
//     "group:create",
//     "group:edit",
//     "group:archive",
//     "enrollment:manage",
//   ]),
// };

// export type Action =
//   | "branch:create"
//   | "member:invite"
//   | "member:change-role"
//   | "member:disable"
//   | "member:invite-teacher"
//   | "member:disable-teacher"
//   | "settings:manage"
//   | "attendance:write"
//   | "progress:write"
//   | "student:create"
//   | "student:edit"
//   | "student:archive"
//   | "student:report"
//   | "student:import"
//   | "student:delete"
//   | "report:create"
//   | "report:edit"
//   | "report:delete"
//   | "teacher:create"
//   | "teacher:edit"
//   | "teacher:archive"
//   | "teacher:delete"
//   | "group:create"
//   | "group:edit"
//   | "group:archive"
//   | "group:delete"
//   | "enrollment:manage";

// export function can(role: Role, action: Action): boolean {
//   return MATRIX[role]?.has(action) ?? false;
// }

// // Rank for "no one grants above their own level".
// export function rank(role: Role): number {
//   return role === "center_admin" ? 3 : role === "branch_admin" ? 2 : 1;
// }

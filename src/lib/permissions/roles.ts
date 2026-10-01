import type { MembershipRole } from "@/db/models/Membership";

// Single source of truth for roles. No role checks outside can() + membership guards.
export const ROLES = ["center_admin", "branch_admin", "teacher"] as const;

export type Role = MembershipRole;

// Static matrix: can this role attempt this action at all (no DB needed).
// Stateful rules (creator protection, last admin) live in services/memberships.ts.
const MATRIX: Record<Role, Set<string>> = {
  center_admin: new Set([
    "branch:create",
    "member:invite",
    "member:change-role",
    "member:disable",
    "program:manage",
    "settings:manage",
  ]),
  branch_admin: new Set(["member:invite-teacher", "member:disable-teacher"]),
  teacher: new Set(["attendance:write", "progress:write"]),
};

export type Action =
  | "branch:create"
  | "member:invite"
  | "member:change-role"
  | "member:disable"
  | "member:invite-teacher"
  | "member:disable-teacher"
  | "program:manage"
  | "settings:manage"
  | "attendance:write"
  | "progress:write";

export function can(role: Role, action: Action): boolean {
  return MATRIX[role]?.has(action) ?? false;
}

// Rank for "no one grants above their own level".
export function rank(role: Role): number {
  return role === "center_admin" ? 3 : role === "branch_admin" ? 2 : 1;
}

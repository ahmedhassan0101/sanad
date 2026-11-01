// src\lib\tenant\context.ts
import type { Types } from "mongoose";
import type { MembershipRole } from "@/db/models/Membership";

// Pure types only — no DB imports allowed in lib.
export type BranchScope =
  | { mode: "all" }
  | { mode: "list"; branchIds: Types.ObjectId[] };

export type SessionContext =
  | { kind: "platform"; userId: string }
  | { kind: "onboarding"; userId: string }
  | { kind: "unverified"; userId: string; email: string }
  | {
      kind: "member";
      userId: string;
      orgId: Types.ObjectId;
      role: MembershipRole;
      branchScope: BranchScope;
    };

import { Schema, model, models, type Document, type Model, type Types } from "mongoose";
// import type { MembershipRole } from "./Membership";

import { MEMBERSHIP_ROLES, type OptionKey } from "@/constants";

export type MembershipRole = OptionKey<typeof MEMBERSHIP_ROLES>;

export interface InviteDoc extends Document {
  orgId: Types.ObjectId;
  // Null for center_admin invites (no branch yet).
  branchId: Types.ObjectId | null;
  role: MembershipRole;
  codeHash: string;
  expiresAt: Date;
  usedAt: Date | null;
  usedByUserId: Types.ObjectId | null;
  revokedAt: Date | null;
  createdByUserId: Types.ObjectId;
  // TTL target: expiresAt + 30 days, so used invites stay queryable for a while.
  purgeAt: Date;
}

const inviteSchema = new Schema<InviteDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    branchId: {
      type: Schema.Types.ObjectId,
      ref: "Branch",
      default: null,
      required: function (this: InviteDoc) {
        return this.role !== "center_admin";
      },
    },
    role: {
      type: String,
      enum: MEMBERSHIP_ROLES.values,
      required: true,
    },
    codeHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    usedAt: { type: Date, default: null },
    usedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    revokedAt: { type: Date, default: null },
    createdByUserId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    purgeAt: { type: Date, required: true },
  },
  { timestamps: true }
);

// Atomic consume checks usedAt == null && revokedAt == null && expiresAt > now
// in a single update; TTL only cleans up via purgeAt.
inviteSchema.index({ purgeAt: 1 }, { expireAfterSeconds: 0 });
inviteSchema.index({ orgId: 1, branchId: 1 });

export const Invite: Model<InviteDoc> =
  (models.Invite as Model<InviteDoc> | undefined) ?? model<InviteDoc>("Invite", inviteSchema);

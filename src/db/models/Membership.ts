import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export type MembershipRole = "center_admin" | "branch_admin" | "supervisor";
export type MembershipStatus = "active" | "disabled";

export interface MembershipDoc extends Document {
  userId: Types.ObjectId;
  orgId: Types.ObjectId;
  role: MembershipRole;
  // Empty means all branches, but only valid for center_admin (derived from role).
  branchIds: Types.ObjectId[];
  status: MembershipStatus;
  invitedByUserId: Types.ObjectId | null;
}

const membershipSchema = new Schema<MembershipDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    orgId: { type: Schema.Types.ObjectId, ref: "Org", required: true },
    role: {
      type: String,
      enum: ["center_admin", "branch_admin", "supervisor"],
      required: true,
    },
    branchIds: {
      type: [{ type: Schema.Types.ObjectId, ref: "Branch" }],
      default: [],
      validate: {
        validator(this: MembershipDoc, v: Types.ObjectId[]) {
          if (this.role === "branch_admin" || this.role === "supervisor") {
            return Array.isArray(v) && v.length >= 1;
          }
          return true;
        },
        message: "branch_admin and teacher require at least one branch",
      },
    },
    status: { type: String, enum: ["active", "disabled"], default: "active" },
    invitedByUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

membershipSchema.index({ userId: 1, orgId: 1 }, { unique: true });
membershipSchema.index({ orgId: 1, status: 1, role: 1 });

export const Membership: Model<MembershipDoc> =
  (models.Membership as Model<MembershipDoc> | undefined) ??
  model<MembershipDoc>("Membership", membershipSchema);

import { Schema, model, models, type Document, type Model, type Types } from "mongoose";

export interface AuditLogDoc extends Document {
  orgId: Types.ObjectId | null;
  actorUserId: Types.ObjectId | null;
  action: string;
  targetType: string | null;
  targetId: string | null;
}

const auditLogSchema = new Schema<AuditLogDoc>(
  {
    orgId: { type: Schema.Types.ObjectId, ref: "Org", default: null },
    actorUserId: { type: Schema.Types.ObjectId, ref: "User", default: null },
    action: { type: String, required: true },
    targetType: { type: String, default: null },
    targetId: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// TTL on a single field only; the org-scoped query index is separate.
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15552000 }); // 180 days
auditLogSchema.index({ orgId: 1, createdAt: -1 });

export const AuditLog: Model<AuditLogDoc> =
  (models.AuditLog as Model<AuditLogDoc> | undefined) ??
  model<AuditLogDoc>("AuditLog", auditLogSchema);

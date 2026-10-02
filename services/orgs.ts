// إنشاء مركز: مركز + فرع رئيسي + عضوية مالك + برامج — في عملية واحدة.
import "server-only";
import mongoose, { Types } from "mongoose";
import { z } from "zod";
import { connectDB } from "@/db/connection";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { OrgProgram } from "@/db/models/OrgProgram";
import { User } from "@/db/models/User";

const inputSchema = z.object({
  name: z.string().trim().min(2).max(80),
  contactPhone: z.string().trim().min(7).max(20),
  addressText: z.string().trim().max(200).optional(),
  programs: z.array(z.string().min(1)).min(1).max(20),
});

export async function createCenter(userId: string, raw: unknown) {
  const parsed = inputSchema.safeParse(raw);
  if (!parsed.success) throw new Error("VALIDATION: بيانات المركز ناقصة");
  await connectDB();
  const uid = new Types.ObjectId(userId);
  const creator = await User.findById(uid).select("emailVerifiedAt");
  if (!creator || !creator.emailVerifiedAt) {
    throw new Error("VALIDATION: فعّل بريدك أولاً قبل إنشاء مركز");
  }
  const owned = await Org.countDocuments({ createdByUserId: uid });
  if (owned >= 3) throw new Error("FORBIDDEN: الحد الأقصى 3 مراكز");
  const session = await mongoose.startSession();
  try {
    let out: { orgId: string } = { orgId: "" };
    await session.withTransaction(async () => {
      const createdOrgs = await Org.create(
        [
          {
            name: parsed.data.name,
            contactPhone: parsed.data.contactPhone,
            addressText: parsed.data.addressText ?? null,
            createdByUserId: uid,
          },
        ],
        { session }
      );
      const org = createdOrgs[0]!;
      const createdBranches = await Branch.create([{ orgId: org._id, name: "الفرع الرئيسي" }], {
        session,
        ordered: true,
      });
      void createdBranches;
      await Membership.create(
        [{ userId: uid, orgId: org._id, role: "center_admin", branchIds: [], invitedByUserId: uid }],
        { session, ordered: true }
      );
      await OrgProgram.create(
        parsed.data.programs.map((programKey) => ({ orgId: org._id, programKey })),
        { session, ordered: true }
      );
      out = { orgId: String(org._id) };
    });
    return out;
  } finally {
    await session.endSession();
  }
}

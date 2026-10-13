// seed-dev.ts
import { connectDB } from "@/db/connection";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
import { ProgressReport } from "@/db/models/ProgressReport";
import { generateCode } from "@/lib/invite-code";
import { normalizeArabic } from "@/lib/students";
import { getEnv } from "@/lib/env";
import mongoose, { type Types } from "mongoose";

// Dev-only fixture: two isolated orgs for isolation tests.
// Refuses production unless ALLOW_DEV_SEED=true is set explicitly.
export async function seedDev() {
  const env = getEnv();
  if (env.nodeEnv === "production" && !env.allowDevSeed) {
    throw new Error("seed-dev refuses production without ALLOW_DEV_SEED=true");
  }
  await connectDB();
  async function makeOrg(orgName: string, branchName: string, adminEmail: string) {
    const admin = await User.create({ name: `${orgName} admin`, email: adminEmail });
    const org = await Org.create({
      name: orgName,
      contactPhone: "01000000000",
      createdByUserId: admin._id,
    });
    const branch = await Branch.create({ orgId: org._id, name: branchName });
    await Membership.create({
      userId: admin._id,
      orgId: org._id,
      role: "center_admin",
      branchIds: [],
      invitedByUserId: admin._id,
    });
    return { admin, org, branch };
  }
  const a = await makeOrg("Dev Org A", "Main", "deva@example.com");
  const b = await makeOrg("Dev Org B", "Main", "devb@example.com");
  await seedStudents(a.org._id, a.branch._id, a.admin._id);
  return { a, b };
}

const FIRST = ["أحمد", "محمد", "يوسف", "عمر", "علي", "فاطمة", "مريم", "خديجة", "عائشة", "زينب"];
const LAST = ["إبراهيم", "السيد", "حسن", "عبد الله", "الشريف", "منصور", "كامل", "فؤاد"];
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

// 50 طالبًا وهميًا بأسماء ومستويات متنوعة وبعضهم ببيانات ناقصة.
async function seedStudents(orgId: Types.ObjectId, branchId: Types.ObjectId, adminId: Types.ObjectId) {
  if (await Student.countDocuments({ orgId }) > 0) return;
  const docs = [];
  for (let i = 0; i < 50; i++) {
    const name = `${FIRST[i % FIRST.length]} ${LAST[(i * 3) % LAST.length]} ${i + 1}`;
    const incompleteGuardian = i % 5 === 4;
    const incompleteBirth = i % 7 === 6;
    docs.push({
      orgId,
      branchId,
      name,
      nameSearch: normalizeArabic(name),
      gender: i % 3 === 0 ? "female" : "male",
      level: LEVELS[i % LEVELS.length],
      birthDate: incompleteBirth ? null : new Date(Date.UTC(2012 + (i % 7), i % 12, (i % 27) + 1, 12)),
      phone: null,
      address: null,
      notes: null,
      image: null,
      guardians: incompleteGuardian ? [] : [{ relation: "father", phone: `0100000${String(1000 + i)}` }],
      hifzStart: null,
      hifzPosition: null,
      status: "active",
      archivedAt: null,
      parentCode: await uniqueSeedCode(),
    });
  }
  await Student.insertMany(docs);
  const created = await Student.find({ orgId }).select("_id").lean();
  await seedReports(orgId, branchId, adminId, created.map((s) => s._id));
}

// 2–5 تقارير لأول 15 طالبًا بمواضع متنوعة (بعضها عكسي من الناس للخلف).
async function seedReports(
  orgId: Types.ObjectId,
  branchId: Types.ObjectId,
  adminId: Types.ObjectId,
  studentIds: Types.ObjectId[],
) {
  if (await ProgressReport.countDocuments({ orgId }) > 0) return;
  const paths = [
    [{ surah: 114, ayah: 1 }, { surah: 114, ayah: 6 }, { surah: 113, ayah: 1 }],
    [{ surah: 1, ayah: 1 }, { surah: 1, ayah: 7 }, { surah: 2, ayah: 5 }, { surah: 2, ayah: 20 }],
    [{ surah: 112, ayah: 1 }, { surah: 112, ayah: 4 }],
    [{ surah: 36, ayah: 1 }, { surah: 36, ayah: 20 }, { surah: 36, ayah: 40 }, { surah: 36, ayah: 58 }],
    [{ surah: 18, ayah: 1 }, { surah: 18, ayah: 10 }],
  ];
  const trends = ["up", "stable", "down"] as const;
  const ratings = ["excellent", "very_good", "good", "needs_practice"] as const;
  const docs = [];
  const targets = studentIds.slice(0, 15);
  for (const [si, sid] of targets.entries()) {
    const path = paths[si % paths.length]!;
    for (const [ri, pos] of path.entries()) {
      const day = String(ri + 1).padStart(2, "0");
      docs.push({
        orgId,
        branchId,
        studentId: sid,
        reportDateKey: `2026-09-${day}`,
        hifzPosition: { ...pos },
        revisionPosition: ri === 0 ? null : { ...path[ri - 1]! },
        tajweedRating: ratings[(si + ri) % ratings.length],
        trend: trends[(si + ri) % trends.length],
        notes: null,
        createdByUserId: adminId,
      });
    }
  }
  await ProgressReport.insertMany(docs);
  // زامن مواضع الطلاب مع أحدث تقاريرهم.
  for (const sid of targets) {
    const latest = await ProgressReport.findOne({ studentId: sid }).sort({
      reportDateKey: -1,
      createdAt: -1,
    });
    if (latest) {
      await Student.updateOne(
        { _id: sid },
        { $set: { hifzPosition: { ...latest.hifzPosition }, hifzStart: { ...latest.hifzPosition } } },
      );
    }
  }
}

async function uniqueSeedCode(): Promise<string> {
  for (let i = 0; i < 5; i++) {
    const code = generateCode(10);
    if (!(await Student.exists({ parentCode: code }))) return code;
  }
  throw new Error("seed parentCode collision");
}

if (process.argv[1]?.endsWith("seed-dev.ts")) {
  seedDev()
    .then(() => mongoose.disconnect())
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}

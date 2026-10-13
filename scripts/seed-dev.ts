// seed-dev.ts
import { connectDB } from "@/db/connection";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
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
  await seedStudents(a.org._id, a.branch._id);
  return { a, b };
}

const FIRST = ["أحمد", "محمد", "يوسف", "عمر", "علي", "فاطمة", "مريم", "خديجة", "عائشة", "زينب"];
const LAST = ["إبراهيم", "السيد", "حسن", "عبد الله", "الشريف", "منصور", "كامل", "فؤاد"];
const LEVELS = ["beginner", "intermediate", "advanced"] as const;

// 50 طالبًا وهميًا بأسماء ومستويات متنوعة وبعضهم ببيانات ناقصة.
async function seedStudents(orgId: Types.ObjectId, branchId: Types.ObjectId) {
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

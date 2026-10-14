// انحدار بحث الطلاب: «احمد» يجد «أحمد» (تطبيع الهمزات)، والبحث برقم الهاتف.
// السبب الجذري كان في العميل (nuqs shallow:true لا يُعيد تشغيل الـ Server Component)
// وتم إصلاحه بـ shallow:false — وهذا الاختبار يثبت طبقة الخدمة/التطبيع.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { createStudent, listStudents } from "../services/students";

let replSet: MongoMemoryReplSet;
let ids: { admin: Types.ObjectId; org: Types.ObjectId; branch: Types.ObjectId };

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(async () => {
  await clearDB();
  const admin = await User.create({ name: "A", email: "a@s.test", emailVerifiedAt: new Date() });
  const org = await Org.create({ name: "O", contactPhone: "01", createdByUserId: admin._id });
  const branch = await Branch.create({ orgId: org._id, name: "B1" });
  await Membership.create({ userId: admin._id, orgId: org._id, role: "center_admin" });
  ids = { admin: admin._id, org: org._id, branch: branch._id };
});

function ctx() {
  return {
    kind: "member" as const,
    userId: String(ids.admin),
    orgId: ids.org,
    role: "center_admin" as const,
    branchScope: { mode: "all" as const },
  };
}

describe("student search regression", () => {
  it("«احمد» يجد «أحمد»", async () => {
    await createStudent(ctx(), {
      name: "أحمد محمد",
      gender: "male",
      level: "beginner",
      birthDate: "2016-05-01",
      guardians: [{ relation: "father", phone: "01000000001" }],
    });
    const res = await listStudents(ctx(), { q: "احمد" });
    expect(res.total).toBe(1);
    expect(res.items[0]!.name).toContain("أحمد");
  });

  it("البحث برقم الهاتف يجد الطالب", async () => {
    await createStudent(ctx(), {
      name: "كريم علي",
      gender: "male",
      level: "beginner",
      birthDate: "2016-05-01",
      phone: "01012345678",
      guardians: [{ relation: "father", phone: "01000000001" }],
    });
    const res = await listStudents(ctx(), { q: "01012345678" });
    expect(res.total).toBe(1);
  });
});

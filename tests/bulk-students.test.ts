// اختبار الإدخال الجماعي: تنظيف الهاتف، تحويل العربي، العزل، الحدود، التكرار.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
import { cleanPhone, toOptionKey } from "@/lib/students";
import { GENDERS, LEVELS, GUARDIAN_RELATIONS, QURAN_SURAHS } from "@/constants/students";
import { createStudentsBulk, listStudents } from "../services/students";

let replSet: MongoMemoryReplSet;
let ids: { orgA: Types.ObjectId; orgB: Types.ObjectId; a1: Types.ObjectId; a2: Types.ObjectId };

type Ctx = Parameters<typeof listStudents>[0];

function memberCtx(
  userId: Types.ObjectId,
  orgId: Types.ObjectId,
  role: "center_admin" | "branch_admin" | "supervisor",
  branchIds: Types.ObjectId[],
): Ctx {
  return {
    kind: "member",
    userId: String(userId),
    orgId,
    role,
    branchScope: role === "center_admin" ? { mode: "all" } : { mode: "list", branchIds },
  };
}

let users: { adminA: Types.ObjectId; adminB: Types.ObjectId; supervisor: Types.ObjectId };

beforeAll(async () => {
  replSet = await startMemoryDB();
});

afterAll(async () => {
  await stopMemoryDB(replSet);
});

beforeEach(async () => {
  await clearDB();
  const mk = async (name: string, email: string) =>
    User.create({ name, email, emailVerifiedAt: new Date() });
  const adminA = await mk("AdminA", "aa@bulk.test");
  const adminB = await mk("AdminB", "ab@bulk.test");
  const supervisor = await mk("Teacher", "tt@bulk.test");
  const orgA = await Org.create({ name: "A", contactPhone: "01", createdByUserId: adminA._id });
  const orgB = await Org.create({ name: "B", contactPhone: "01", createdByUserId: adminB._id });
  const a1 = await Branch.create({ orgId: orgA._id, name: "A1" });
  const a2 = await Branch.create({ orgId: orgA._id, name: "A2" });
  await Branch.create({ orgId: orgB._id, name: "B1" });
  await Membership.create({ userId: adminA._id, orgId: orgA._id, role: "center_admin" });
  await Membership.create({ userId: adminB._id, orgId: orgB._id, role: "center_admin" });
  await Membership.create({ userId: supervisor._id, orgId: orgA._id, role: "supervisor", branchIds: [a1._id] });
  users = { adminA: adminA._id, adminB: adminB._id, supervisor: supervisor._id };
  ids = { orgA: orgA._id, orgB: orgB._id, a1: a1._id, a2: a2._id };
});

describe("cleanPhone", () => {
  it("cleans arabic digits, spaces, prefixes, and excel-cut zero", () => {
    expect(cleanPhone("٠١٠٠ ٠٠٠-٠٠٠١")).toBe("01000000001");
    expect(cleanPhone("+20 100 000 0001")).toBe("01000000001");
    expect(cleanPhone("00201000000001")).toBe("01000000001");
    expect(cleanPhone("(010) 000-0001")).toBe("0100000001");
    expect(cleanPhone(1000000001)).toBe("01000000001");
    expect(cleanPhone(null)).toBe("");
    expect(cleanPhone("")).toBe("");
  });
});

describe("toOptionKey", () => {
  it("maps arabic labels and english keys, ignores spaces/diacritics", () => {
    expect(toOptionKey("ذكر", GENDERS)).toBe("male");
    expect(toOptionKey("  male ", GENDERS)).toBe("male");
    expect(toOptionKey("مُبتدئ", LEVELS)).toBe("beginner");
    expect(toOptionKey("الأم", GUARDIAN_RELATIONS)).toBe("mother");
    expect(toOptionKey("غير معروف", GENDERS)).toBeUndefined();
    expect(toOptionKey("", GENDERS)).toBeUndefined();
    expect(toOptionKey(null, GENDERS)).toBeUndefined();
  });
  it("maps surah arabic names", () => {
    const surahs = {
      keys: QURAN_SURAHS.map((s) => String(s.number)),
      labels: Object.fromEntries(QURAN_SURAHS.map((s) => [String(s.number), s.name])),
    };
    expect(toOptionKey("البقرة", surahs)).toBe("2");
    expect(toOptionKey("114", surahs)).toBe("114");
  });
});

describe("createStudentsBulk", () => {
  const row = (name: string) => ({
    name,
    gender: "male",
    level: "beginner",
    guardians: [{ relation: "father", phone: "01000000001" }],
  });

  it("saves valid rows, flags invalid, and enforces org/branch isolation", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const res = await createStudentsBulk(
      adminA,
      [row("طالب أول"), { name: "", gender: "male", level: "beginner", guardians: [] }, row("طالب ثالث")],
      { branchId: String(ids.a1) },
    );
    expect(res.map((r) => r.status)).toEqual(["saved", "invalid", "saved"]);
    expect(res[1]!.errors.length).toBeGreaterThan(0);
    expect(await Student.countDocuments({ orgId: ids.orgA })).toBe(2);
    // supervisor خارج الفرع مرفوض، ومركز آخر لا يرى شيئًا
    const supervisor = memberCtx(users.supervisor, ids.orgA, "supervisor", [ids.a1]);
    await expect(
      createStudentsBulk(supervisor, [row("x")], { branchId: String(ids.a2) }),
    ).rejects.toThrow("FORBIDDEN");
    const adminB = memberCtx(users.adminB, ids.orgB, "center_admin", []);
    expect((await listStudents(adminB, {})).total).toBe(0);
  });

  it("rejects over-500 batches", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const rows = Array.from({ length: 501 }, (_, i) => row(`طالب ${i}`));
    await expect(createStudentsBulk(adminA, rows, { branchId: String(ids.a1) })).rejects.toThrow("500");
  });

  it("flags in-batch and DB duplicates, saves on confirm", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const first = await createStudentsBulk(adminA, [row("مكرر")], { branchId: String(ids.a1) });
    expect(first[0]!.status).toBe("saved");
    const second = await createStudentsBulk(
      adminA,
      [row("مكرر"), row("مكرر"), row("جديد")],
      { branchId: String(ids.a1) },
    );
    expect(second.map((r) => r.status)).toEqual(["duplicate", "duplicate", "saved"]);
    expect(second[0]!.duplicate?.name).toBe("مكرر");
    const third = await createStudentsBulk(adminA, [row("مكرر")], {
      branchId: String(ids.a1),
      confirmDuplicateRows: [0],
    });
    expect(third[0]!.status).toBe("saved");
  });

  it("cleans arabic-digit phones server-side", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const res = await createStudentsBulk(
      adminA,
      [{ ...row("هواتف"), guardians: [{ relation: "father", phone: "٠١٠٠٠٠٠٠٠٠٢" }] }],
      { branchId: String(ids.a1) },
    );
    expect(res[0]!.status).toBe("saved");
    const saved = await Student.findById(res[0]!.id).lean();
    expect(saved?.guardians[0]?.phone).toBe("01000000002");
  });
});

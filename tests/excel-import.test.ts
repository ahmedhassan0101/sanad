// اختبار الاستيراد: أنواع الخلايا، الأرقام العربية، الصفر المقصوص، التواريخ،
// العناوين الناقصة، الصفوف الفارغة، الحدود، تطابق المعاينة مع الحفظ، العزل.
import { beforeAll, afterAll, beforeEach, describe, expect, it } from "vitest";
import type { MongoMemoryReplSet } from "mongodb-memory-server";
import ExcelJS from "exceljs";
import { Types } from "mongoose";
import { startMemoryDB, stopMemoryDB, clearDB } from "./helpers/db";
import { User } from "@/db/models/User";
import { Org } from "@/db/models/Org";
import { Branch } from "@/db/models/Branch";
import { Membership } from "@/db/models/Membership";
import { Student } from "@/db/models/Student";
import {
  MAX_IMPORT_BYTES,
  cellText,
  parseStudentWorkbook,
  toCreateInput,
} from "../src/lib/excel-import";
import { createStudentsBulk, listStudents, previewBulkImport } from "../services/students";

let replSet: MongoMemoryReplSet;
let ids: { orgA: Types.ObjectId; orgB: Types.ObjectId; a1: Types.ObjectId };

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

async function workbookToBuffer(build: (ws: ExcelJS.Worksheet) => void): Promise<ArrayBuffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("البيانات");
  build(ws);
  const buf = await wb.xlsx.writeBuffer();
  return buf instanceof ArrayBuffer ? buf : new Uint8Array(buf).buffer as ArrayBuffer;
}

const HEADERS = ["الاسم*", "النوع*", "المستوى*", "تاريخ الميلاد", "هاتف الطالب", "صلة القرابة", "هاتف ولي الأمر", "العنوان", "ملاحظات", "السورة", "الآية"];

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
  const adminA = await mk("AdminA", "aa@imp.test");
  const adminB = await mk("AdminB", "ab@imp.test");
  const supervisor = await mk("Teacher", "tt@imp.test");
  const orgA = await Org.create({ name: "A", contactPhone: "01", createdByUserId: adminA._id });
  const orgB = await Org.create({ name: "B", contactPhone: "01", createdByUserId: adminB._id });
  const a1 = await Branch.create({ orgId: orgA._id, name: "A1" });
  await Branch.create({ orgId: orgA._id, name: "A2" });
  await Branch.create({ orgId: orgB._id, name: "B1" });
  await Membership.create({ userId: adminA._id, orgId: orgA._id, role: "center_admin" });
  await Membership.create({ userId: adminB._id, orgId: orgB._id, role: "center_admin" });
  await Membership.create({ userId: supervisor._id, orgId: orgA._id, role: "supervisor", branchIds: [a1._id] });
  users = { adminA: adminA._id, adminB: adminB._id, supervisor: supervisor._id };
  ids = { orgA: orgA._id, orgB: orgB._id, a1: a1._id };
});

describe("cellText", () => {
  it("handles excel cell types without blind String()", () => {
    expect(cellText(null)).toBe("");
    expect(cellText(42)).toBe("42");
    expect(cellText(true)).toBe("true");
    expect(cellText(new Date(2016, 4, 1))).toBe("2016-05-01");
    expect(cellText({ richText: [{ text: "أ" }, { text: "ب" }] })).toBe("أب");
    expect(cellText({ formula: "1+1", result: 2 })).toBe("2");
    expect(cellText({ text: "نص", hyperlink: "http://x" })).toBe("نص");
    expect(cellText({ error: "#DIV/0!" })).toBe("");
  });
});

describe("parseStudentWorkbook", () => {
  it("reads headers by name, skips empty rows, cleans phones and dates", async () => {
    const buf = await workbookToBuffer((ws) => {
      ws.addRow(HEADERS);
      ws.addRow(["  أحمد  ", "ذكر", "مبتدئ", new Date(2016, 4, 1), 1000000001, "الأب", "٠١٠٠٠٠٠٠٠٠٢", "", "", "البقرة", 5]);
      ws.addRow(["", "", "", "", "", "", "", "", "", "", ""]);
      ws.addRow(["منى", "أنثى", "", "", "", "", "", "", "", "", ""]);
    });
    const rows = await parseStudentWorkbook(buf);
    expect(rows).toHaveLength(2);
    expect(rows[0]!.excelRow).toBe(2);
    expect(rows[0]!.data.name).toBe("أحمد");
    expect(rows[0]!.data.birthDate).toBe("2016-05-01");
    expect(rows[0]!.data.guardianPhone).toBe("01000000002");
    expect(rows[0]!.data.phone).toBe("01000000001");
    expect(rows[0]!.data.surah).toBe("البقرة");
    expect(rows[1]!.data.level).toBe("beginner");
  });

  it("rejects non-zip signature, missing headers, and oversize", async () => {
    await expect(parseStudentWorkbook(new TextEncoder().encode("hello").buffer as ArrayBuffer)).rejects.toThrow(
      ".xlsx",
    );
    const bad = await workbookToBuffer((ws) => {
      ws.addRow(["الاسم*", "النوع*"]);
      ws.addRow(["س", "ذكر"]);
    });
    await expect(parseStudentWorkbook(bad)).rejects.toThrow("ناقصة");
    const big = new ArrayBuffer(MAX_IMPORT_BYTES + 1);
    new Uint8Array(big).set([0x50, 0x4b]);
    await expect(parseStudentWorkbook(big)).rejects.toThrow("5MB");
  });

  it("rejects over-500 data rows", async () => {
    const buf = await workbookToBuffer((ws) => {
      ws.addRow(HEADERS);
      for (let i = 0; i < 501; i++) ws.addRow([`طالب ${i}`, "ذكر", "مبتدئ"]);
    });
    await expect(parseStudentWorkbook(buf)).rejects.toThrow("500");
  });
});

describe("toCreateInput", () => {
  it("maps arabic values and flags partial hifz", () => {
    const { input, errors } = toCreateInput({
      name: "س",
      gender: "أنثى",
      level: "",
      relation: "الأم",
      guardianPhone: "01000000001",
      surah: "البقرة",
    });
    expect(input.gender).toBe("female");
    expect(errors.some((e) => e.column === "موضع الحفظ")).toBe(true);
  });
});

describe("preview matches commit, perms and isolation hold", () => {
  it("preview flags, commit saves valid only, supervisor out of scope forbidden", async () => {
    const adminA = memberCtx(users.adminA, ids.orgA, "center_admin", []);
    const buf = await workbookToBuffer((ws) => {
      ws.addRow(HEADERS);
      ws.addRow(["صالح", "ذكر", "مبتدئ", "", "", "الأب", "01000000001", "", "", "البقرة", 5]);
      ws.addRow(["ناقص", "", "مبتدئ", "", "", "", "", "", "", "", ""]);
      ws.addRow(["صالح", "ذكر", "مبتدئ", "", "", "", "", "", "", "", ""]);
    });
    const parsed = await parseStudentWorkbook(buf);
    const preview = await previewBulkImport(adminA, parsed, { branchId: String(ids.a1) });
    expect(preview.map((r) => r.status)).toEqual(["valid", "invalid", "duplicate"]);
    expect(preview[1]!.errors[0]!.column).toBe("النوع");
    const saved = await createStudentsBulk(
      adminA,
      preview.filter((r) => r.status === "valid").map((r) => r.data),
      { branchId: String(ids.a1) },
    );
    expect(saved.every((r) => r.status === "saved")).toBe(true);
    expect(await Student.countDocuments({ orgId: ids.orgA })).toBe(1);
    const supervisor = memberCtx(users.supervisor, ids.orgA, "supervisor", [ids.a1]);
    await expect(previewBulkImport(supervisor, parsed, { branchId: undefined })).rejects.toThrow();
  });
});

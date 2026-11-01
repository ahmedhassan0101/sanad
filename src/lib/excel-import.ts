// قراءة ملف استيراد الطلاب (.xlsx فقط): توقيع zip، أول ورقة، عناوين بالاسم.
// لا تُنفَّذ معادلات ولا يُسجَّل محتوى الملف في الـ logs.
import ExcelJS from "exceljs";
import { GENDERS, GUARDIAN_RELATIONS, LEVELS, QURAN_SURAHS } from "@/constants";
import { cleanPhone, toOptionKey } from "./students";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 500;

// الأعمدة المعروفة بالعربي (بدون *) أو بالإنجليزية.
const HEADER_MAP: Record<string, string> = {
  الاسم: "name",
  name: "name",
  النوع: "gender",
  gender: "gender",
  المستوى: "level",
  level: "level",
  "تاريخ الميلاد": "birthDate",
  birthdate: "birthDate",
  "هاتف الطالب": "phone",
  phone: "phone",
  "صلة القرابة": "relation",
  relation: "relation",
  "هاتف ولي الأمر": "guardianPhone",
  guardianphone: "guardianPhone",
  العنوان: "address",
  address: "address",
  ملاحظات: "notes",
  notes: "notes",
  السورة: "surah",
  surah: "surah",
  الآية: "ayah",
  ayah: "ayah",
};

const REQUIRED = ["name", "gender", "level"] as const;

export interface ParsedImportRow {
  excelRow: number;
  data: Record<string, unknown>;
}

function headerKey(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const h = raw.replace(/\*/g, "").trim().toLowerCase();
  return HEADER_MAP[h] ?? null;
}

// استخراج القيمة حسب نوع خلية ExcelJS بدل String() العمياء.
export function cellText(value: ExcelJS.CellValue): string {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) {
    const p = (n: number) => String(n).padStart(2, "0");
    return `${value.getFullYear()}-${p(value.getMonth() + 1)}-${p(value.getDate())}`;
  }
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    if (typeof value === "number" && Number.isInteger(value))
      return String(Math.trunc(value));
    return String(value);
  }
  if (typeof value === "object") {
    if (
      "richText" in value &&
      Array.isArray((value as { richText: { text: string }[] }).richText)
    ) {
      return (value as { richText: { text: string }[] }).richText
        .map((t) => t.text)
        .join("");
    }
    if ("result" in value)
      return cellText((value as { result: ExcelJS.CellValue }).result);
    if ("text" in value) return String((value as { text: unknown }).text ?? "");
    if ("error" in value) return "";
  }
  return "";
}

function excelSerialToDate(n: number): string {
  const ms = Math.round((n - 25569) * 86400 * 1000);
  const d = new Date(ms);
  const p = (x: number) => String(x).padStart(2, "0");
  return `${d.getUTCFullYear()}-${p(d.getUTCMonth() + 1)}-${p(d.getUTCDate())}`;
}

const SURAH_OPTIONS = {
  keys: QURAN_SURAHS.map((s) => String(s.number)),
  labels: Object.fromEntries(
    QURAN_SURAHS.map((s) => [String(s.number), s.name]),
  ),
};

export async function parseStudentWorkbook(
  buffer: ArrayBuffer,
): Promise<ParsedImportRow[]> {
  const bytes = new Uint8Array(buffer);
  if (bytes.length > MAX_IMPORT_BYTES)
    throw new Error("VALIDATION: الملف أكبر من 5MB");
  if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new Error("VALIDATION: الملف ليس Excel (.xlsx) صالحًا");
  }
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.load(buffer);
  const ws = wb.worksheets[0];
  if (!ws) throw new Error("VALIDATION: الملف بلا أوراق");
  const headerRow = ws.getRow(1);
  const colIndex = new Map<string, number>();
  headerRow.eachCell((cell, col) => {
    const key = headerKey(
      typeof cell.value === "string" ? cell.value : cellText(cell.value),
    );
    if (key && !colIndex.has(key)) colIndex.set(key, col);
  });
  const missing = REQUIRED.filter((r) => !colIndex.has(r));
  if (missing.length > 0) {
    throw new Error(`VALIDATION: أعمدة ناقصة: ${missing.join("، ")}`);
  }
  const rows: ParsedImportRow[] = [];
  ws.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const get = (key: string): string => {
      const col = colIndex.get(key);
      if (!col) return "";
      return cellText(row.getCell(col).value).trim();
    };
    const raw: Record<string, string> = {};
    for (const key of colIndex.keys()) raw[key] = get(key);
    if (Object.values(raw).every((v) => v === "")) return;
    rows.push({ excelRow: rowNumber, data: mapRow(raw) });
  });
  const nonEmpty = rows;
  if (nonEmpty.length > MAX_IMPORT_ROWS) {
    throw new Error("VALIDATION: الحد الأقصى 500 صف");
  }
  return nonEmpty;
}

// تنظيف وتحويل صف خام إلى شكل مخطط الإنشاء (بدون الفرع).
// القيم غير المعروفة تُمرَّر كما هي ليرفضها zod برسالة عربية واضحة.
export function mapRow(raw: Record<string, string>): Record<string, unknown> {
  const birthRaw = raw.birthDate ?? "";
  let birthDate = birthRaw;
  if (/^\d+(\.\d+)?$/.test(birthRaw)) {
    birthDate = excelSerialToDate(Number(birthRaw));
  }
  const ayahRaw = (raw.ayah ?? "").trim();
  const ayahNum = ayahRaw === "" ? undefined : Number(ayahRaw);
  return {
    name: raw.name ?? "",
    gender: (raw.gender ?? "").trim(),
    level: (raw.level ?? "").trim() === "" ? "beginner" : raw.level!.trim(),
    birthDate: birthDate || undefined,
    phone: cleanPhone(raw.phone ?? "") || undefined,
    relation: (raw.relation ?? "").trim(),
    guardianPhone: cleanPhone(raw.guardianPhone ?? "") || undefined,
    address: raw.address?.trim() || undefined,
    notes: raw.notes?.trim() || undefined,
    surah: (raw.surah ?? "").trim(),
    ayah:
      ayahRaw === ""
        ? undefined
        : Number.isInteger(ayahNum)
          ? ayahNum
          : ayahRaw,
  };
}

export const COLUMN_AR: Record<string, string> = {
  name: "الاسم",
  gender: "النوع",
  level: "المستوى",
  birthDate: "تاريخ الميلاد",
  phone: "هاتف الطالب",
  relation: "صلة القرابة",
  guardianPhone: "هاتف ولي الأمر",
  address: "العنوان",
  notes: "ملاحظات",
  surah: "السورة",
  ayah: "الآية",
  guardians: "ولي الأمر",
  hifz: "موضع الحفظ",
};

export interface MappedRow {
  input: Record<string, unknown>;
  errors: { column: string; message: string }[];
}

// تحويل الصف المنظف إلى مدخلات مخطط الإنشاء + أخطاء منطقية (سورة بلا آية...).
// يقبل شكل Excel الخام (relation/guardianPhone) أو شكلًا مبنيًا (guardians).
export function toCreateInput(cleaned: Record<string, unknown>): MappedRow {
  const errors: { column: string; message: string }[] = [];
  const str = (v: unknown) => (typeof v === "string" ? v : "");
  const gender = toOptionKey(cleaned.gender, GENDERS) ?? str(cleaned.gender);
  const level = toOptionKey(cleaned.level, LEVELS) ?? str(cleaned.level);
  let guardians: { relation: string; phone: string }[];
  if (Array.isArray(cleaned.guardians)) {
    guardians = (cleaned.guardians as Record<string, unknown>[]).map((g) => ({
      relation:
        toOptionKey(g?.relation, GUARDIAN_RELATIONS) ?? str(g?.relation),
      phone: cleanPhone(g?.phone),
    }));
  } else {
    const relationRaw = str(cleaned.relation);
    const relation =
      relationRaw === ""
        ? ""
        : (toOptionKey(relationRaw, GUARDIAN_RELATIONS) ?? relationRaw);
    const guardianPhone = cleanPhone(str(cleaned.guardianPhone));
    if (relationRaw !== "" && guardianPhone === "") {
      errors.push({
        column: "هاتف ولي الأمر",
        message: "الهاتف مطلوب مع وجود الصلة",
      });
    }
    guardians = guardianPhone
      ? [{ relation: relation || "father", phone: guardianPhone }]
      : [];
  }
  const surahRaw = str(cleaned.surah);
  const ayah = cleaned.ayah;
  let hifz: unknown;
  if (surahRaw === "" && ayah === undefined) {
    hifz = undefined;
  } else if (surahRaw !== "" && typeof ayah === "number") {
    const key = /^\d+$/.test(surahRaw)
      ? surahRaw
      : toOptionKey(surahRaw, SURAH_OPTIONS);
    hifz = key ? { surah: Number(key), ayah } : { surah: surahRaw, ayah };
  } else {
    errors.push({
      column: "موضع الحفظ",
      message: "السورة والآية معًا أو لا شيء",
    });
  }
  return {
    input: {
      name: str(cleaned.name),
      gender,
      level,
      birthDate: str(cleaned.birthDate) || undefined,
      phone: str(cleaned.phone) || undefined,
      address: str(cleaned.address) || undefined,
      notes: str(cleaned.notes) || undefined,
      guardians,
      hifz,
    },
    errors,
  };
}

// Pure student functions (no database): Arabic normalization + incomplete data + age.
export function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .replace(/\s+/g, " ")
    .trim();
}

interface ProfileLike {
  guardians?: { phone?: string | null }[] | null;
  birthDate?: Date | string | null;
}

// Incomplete = no guardian with phone number or no birth date.
export function isProfileIncomplete(student: ProfileLike): boolean {
  const hasGuardianPhone = (student.guardians ?? []).some((g) => !!g.phone?.trim());
  return !hasGuardianPhone || !student.birthDate;
}

// Incomplete = no guardian with phone number or no birth date.
export function incompleteFilter() {
  return {
    $or: [
      { guardians: { $not: { $elemMatch: { phone: { $nin: [null, ""] } } } } },
      { birthDate: null },
    ],
  };
}

// Calculate age from birth date (Date or string) and current date (default = now).
export function calcAge(birthDate: Date | string | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - b.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const LATIN_DIGITS = "0123456789";

// تنظيف رقم هاتف واحد: أرقام عربية ← لاتينية، حذف مسافات/شرطات/أقواس，
// ‎+20/0020 ← 0، ورقم من 10 خانات يبدأ بـ1 ← أضف 0 (Excel يقصّ الصفر الأول).
// Return empty string for null/undefined.
// Clean a single phone number: Arabic digits → Latin, remove spaces/dashes/parentheses,
// +20/0020 → 0, and 10-digit number starting with 1 → add 0 (Excel trims leading zero).
export function cleanPhone(raw: unknown): string {
  if (raw === null || raw === undefined) return "";
  let s = String(raw).trim();
  s = s.replace(/[٠-٩]/g, (d) => LATIN_DIGITS[ARABIC_DIGITS.indexOf(d)]!);
  s = s.replace(/[\s\-().]/g, "");
  s = s.replace(/^(?:\+20|0020)/, "0");
  if (/^1\d{9}$/.test(s)) s = `0${s}`;
  return s;
}

// تحويل قيمة عربية أو إنجليزية إلى مفتاح الثوابت (متجاهلة المسافات والتشكيل).
// تُستخدم للنوع والمستوى والصلة واسم السورة. غير المعروف ← undefined.
// Convert an Arabic or English value to a constant key (ignoring spaces and diacritics).
// Used for type, level, relation, and surah name. Unknown → undefined.
export function toOptionKey(
  raw: unknown,
  options: { keys: readonly string[]; labels: Record<string, string> },
): string | undefined {
  if (raw === null || raw === undefined) return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;
  if ((options.keys as readonly string[]).includes(s)) return s;
  const norm = normalizeArabic(s);
  for (const key of options.keys) {
    if (normalizeArabic(options.labels[key] ?? "") === norm) return key;
  }
  return undefined;
}

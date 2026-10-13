// دوال نقية للطلاب (بلا داتابيز): تطبيع عربي + نقص البيانات + العمر.
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

// ناقص = بلا ولي أمر برقم هاتف أو بلا تاريخ ميلاد.
export function isProfileIncomplete(student: ProfileLike): boolean {
  const hasGuardianPhone = (student.guardians ?? []).some((g) => !!g.phone?.trim());
  return !hasGuardianPhone || !student.birthDate;
}

// نفس الشرط أعلاه كفلتر Mongo — يُستخدم مع scopedFilter.
export function incompleteFilter() {
  return {
    $or: [
      { guardians: { $not: { $elemMatch: { phone: { $nin: [null, ""] } } } } },
      { birthDate: null },
    ],
  };
}

export function calcAge(birthDate: Date | string | null | undefined, now = new Date()): number | null {
  if (!birthDate) return null;
  const b = new Date(birthDate);
  if (Number.isNaN(b.getTime())) return null;
  let age = now.getUTCFullYear() - b.getUTCFullYear();
  const monthDiff = now.getUTCMonth() - b.getUTCMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getUTCDate() < b.getUTCDate())) age -= 1;
  return age;
}

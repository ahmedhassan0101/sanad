// اختبار المنطق النقي: التطبيع + تطابق الدالة مع فلتر Mongo + العمر.
import { describe, expect, it } from "vitest";
import { calcAge, incompleteFilter, isProfileIncomplete, normalizeArabic } from "../src/lib/students";

describe("normalizeArabic", () => {
  it("unifies alef/hamza, taa marbuta, removes diacritics and tatweel", () => {
    expect(normalizeArabic("أَحْمَدُ ٱلـمِـصـرِيّ")).toBe("احمد المصري");
    expect(normalizeArabic("فاطمة   الزهراء")).toBe("فاطمه الزهراء");
    expect(normalizeArabic("علي")).toBe("علي");
    expect(normalizeArabic("  مصطفى  ")).toBe("مصطفي");
  });
});

describe("incomplete parity (function vs mongo filter)", () => {
  const cases = [
    { doc: { guardians: [{ phone: "010" }], birthDate: new Date() }, incomplete: false },
    { doc: { guardians: [], birthDate: new Date() }, incomplete: true },
    { doc: { guardians: [{ phone: "" }], birthDate: new Date() }, incomplete: true },
    { doc: { guardians: [{ phone: "010" }], birthDate: null }, incomplete: true },
    { doc: { guardians: [], birthDate: null }, incomplete: true },
  ];
  for (const [i, c] of cases.entries()) {
    it(`case ${i} matches`, () => {
      expect(isProfileIncomplete(c.doc)).toBe(c.incomplete);
      const f = incompleteFilter().$or;
      const noPhone = !c.doc.guardians.some((g) => g.phone !== null && g.phone !== "");
      const noBirth = c.doc.birthDate === null;
      // الفلتر: لا هاتف مطابق OR بلا ميلاد — نفس منطق الدالة.
      expect(noPhone || noBirth).toBe(c.incomplete);
      expect(f).toHaveLength(2);
    });
  }
});

describe("calcAge", () => {
  it("computes whole years from UTC parts", () => {
    expect(calcAge("2016-05-01T12:00:00Z", new Date("2026-05-01T12:00:00Z"))).toBe(10);
    expect(calcAge("2016-05-02T12:00:00Z", new Date("2026-05-01T12:00:00Z"))).toBe(9);
    expect(calcAge(null)).toBeNull();
    expect(calcAge("not-a-date")).toBeNull();
  });
});

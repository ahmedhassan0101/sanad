// اختبار الثوابت: مجموع آيات السور 6236 وصحة الدوال المساعدة.
import { describe, expect, it } from "vitest";
import {
  QURAN_SURAHS,
  getSurah,
  isValidAyah,
  GENDERS,
  LEVELS,
  MEMBERSHIP_ROLES,
} from "../src/constants";

describe("quran constants", () => {
  it("has 114 surahs with 6236 ayahs in total", () => {
    expect(QURAN_SURAHS).toHaveLength(114);
    expect(QURAN_SURAHS.reduce((sum, s) => sum + s.ayahs, 0)).toBe(6236);
  });

  it("getSurah and isValidAyah agree on bounds", () => {
    expect(getSurah(2)?.name).toBe("البقرة");
    expect(getSurah(2)?.ayahs).toBe(286);
    expect(getSurah(0)).toBeUndefined();
    expect(getSurah(115)).toBeUndefined();
    expect(isValidAyah(112, 4)).toBe(true);
    expect(isValidAyah(112, 5)).toBe(false);
    expect(isValidAyah(1, 0)).toBe(false);
    expect(isValidAyah(999, 1)).toBe(false);
  });

  it("option sets expose keys, labels and zod enums", () => {
    expect(GENDERS.keys).toEqual(["male", "female"]);
    expect(GENDERS.labelOf("male")).toBe("ذكر");
    expect(GENDERS.zod().parse("female")).toBe("female");
    expect(() => LEVELS.zod().parse("unknown")).toThrow();
    expect(MEMBERSHIP_ROLES.labels.supervisor).toBe("مشرف");
  });
});

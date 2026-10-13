// اختبار حسابات التقارير: نفس السورة، عبر السور، عكسي، متطابق، ومنتصف الليل بالقاهرة.
import { describe, expect, it } from "vitest";
import { ayahIndex, ayahsBetween, daysAgoLabel, formatRange, todayKeyCairo } from "../src/lib/progress";

describe("ayahIndex", () => {
  it("starts at 1 and accumulates", () => {
    expect(ayahIndex(1, 1)).toBe(1);
    expect(ayahIndex(1, 7)).toBe(7);
    expect(ayahIndex(2, 1)).toBe(8);
    expect(ayahIndex(114, 6)).toBe(6236);
    expect(ayahIndex(2, 287)).toBeNull();
    expect(ayahIndex(115, 1)).toBeNull();
  });
});

describe("ayahsBetween", () => {
  it("same surah and identical positions", () => {
    expect(ayahsBetween({ surah: 112, ayah: 1 }, { surah: 112, ayah: 4 })).toBe(3);
    expect(ayahsBetween({ surah: 112, ayah: 4 }, { surah: 112, ayah: 4 })).toBe(0);
  });
  it("across surahs and reverse direction give same absolute count", () => {
    const fwd = ayahsBetween({ surah: 113, ayah: 5 }, { surah: 114, ayah: 6 });
    expect(fwd).toBe(6);
    expect(ayahsBetween({ surah: 114, ayah: 6 }, { surah: 113, ayah: 5 })).toBe(fwd);
  });
  it("rejects invalid positions", () => {
    expect(ayahsBetween({ surah: 112, ayah: 9 }, { surah: 112, ayah: 1 })).toBeNull();
  });
});

describe("formatRange", () => {
  it("formats with surah names and count", () => {
    expect(formatRange({ surah: 112, ayah: 1 }, { surah: 114, ayah: 6 })).toBe(
      "من (سورة الإخلاص آية 1) إلى (سورة الناس آية 6) — 14 آية",
    );
    expect(formatRange({ surah: 112, ayah: 9 }, { surah: 112, ayah: 1 })).toBeNull();
  });
});

describe("daysAgoLabel", () => {
  it("labels today, yesterday, days and missing", () => {
    expect(daysAgoLabel(null)).toBe("لا يوجد");
    expect(daysAgoLabel("2026-06-01", "2026-06-01")).toBe("اليوم");
    expect(daysAgoLabel("2026-05-31", "2026-06-01")).toBe("أمس");
    expect(daysAgoLabel("2026-05-20", "2026-06-01")).toBe("منذ 12 يوم");
    expect(daysAgoLabel("2030-01-01", "2026-06-01")).toBe("لا يوجد");
    expect(daysAgoLabel("not-a-date", "2026-06-01")).toBe("لا يوجد");
  });
});

describe("todayKeyCairo", () => {
  it("uses Cairo wall time around midnight", () => {
    // 20:59 UTC = 23:59 Cairo, 21:01 UTC = 00:01 Cairo (summer, UTC+3)
    expect(todayKeyCairo(new Date("2026-06-01T20:59:00Z"))).toBe("2026-06-01");
    expect(todayKeyCairo(new Date("2026-06-01T21:01:00Z"))).toBe("2026-06-02");
    expect(todayKeyCairo(new Date("2026-06-01T12:00:00Z"))).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

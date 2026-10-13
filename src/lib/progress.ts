// حسابات التقارير النقية: ترتيب الآيات تراكميًا بلا أي حكم تقدم/تراجع.
import { QURAN_SURAHS, getSurah } from "@/constants/students";

const PREFIX: number[] = [];
let running = 0;
for (const s of QURAN_SURAHS) {
  PREFIX[s.number] = running;
  running += s.ayahs;
}
export const TOTAL_AYAHS = running;

// الترتيب التراكمي للآية من 1 إلى 6236 (غير صالح ← null).
export function ayahIndex(surah: number, ayah: number): number | null {
  const s = getSurah(surah);
  if (!s || !Number.isInteger(ayah) || ayah < 1 || ayah > s.ayahs) return null;
  return PREFIX[surah]! + ayah;
}

// عدد الآيات بين موضعين (مطلق — الحفظ العكسي مشروع ولا حكم فيه).
export function ayahsBetween(
  from: { surah: number; ayah: number },
  to: { surah: number; ayah: number },
): number | null {
  const a = ayahIndex(from.surah, from.ayah);
  const b = ayahIndex(to.surah, to.ayah);
  if (a === null || b === null) return null;
  return Math.abs(b - a);
}

export function formatRange(
  from: { surah: number; ayah: number },
  to: { surah: number; ayah: number },
): string | null {
  const fs = getSurah(from.surah);
  const ts = getSurah(to.surah);
  const n = ayahsBetween(from, to);
  if (!fs || !ts || n === null) return null;
  return `من (سورة ${fs.name} آية ${from.ayah}) إلى (سورة ${ts.name} آية ${to.ayah}) — ${n} آية`;
}

// مفتاح اليوم بتوقيت القاهرة بصيغة YYYY-MM-DD.
export function todayKeyCairo(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Africa/Cairo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "00";
  return `${get("year")}-${get("month")}-${get("day")}`;
}

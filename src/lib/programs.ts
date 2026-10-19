// كتالوج الأنشطة الجاهزة — يُختار منها عند إنشاء المجموعة.
export const ACTIVITIES_CATALOG = [
  { key: "quran", name: "القرآن" },
  { key: "tajweed", name: "التجويد" },
  { key: "tarbiya", name: "التربية" },
  { key: "maqraa", name: "المقرأة" },
  { key: "sports", name: "الملعب" },
] as const;

export function customProgramKey(name: string): string {
  const slug = name
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
  return `custom:${slug}`;
}

// Quran.com API (api.quran.com/api/v4/chapters).
import { z } from "zod";

export function defineOptions<const T extends readonly string[]>(
  keys: T,
  labels: Record<T[number], string>,
) {
  return {
    keys,
    labels,
    values: [...keys] as T[number][],
    options: (keys as readonly T[number][]).map((value) => ({
      value,
      label: labels[value],
    })),
    labelOf: (value: string) => labels[value as T[number]] ?? value,
    zod: () => z.enum(keys as unknown as [T[number], ...T[number][]]),
  };
}

export type OptionKey<O extends ReturnType<typeof defineOptions>> =
  O["keys"][number];

export const GENDERS = defineOptions(["male", "female"] as const, {
  male: "ذكر",
  female: "أنثى",
});

export const LEVELS = defineOptions(
  ["beginner", "intermediate", "advanced"] as const,
  { beginner: "مبتدئ", intermediate: "متوسط", advanced: "متقدم" },
);

export const STUDENT_STATUS = defineOptions(["active", "archived"] as const, {
  active: "نشط",
  archived: "مؤرشف",
});

export const GUARDIAN_RELATIONS = defineOptions(
  [
    "father",
    "mother",
    "brother",
    "sister",
    "grandfather",
    "grandmother",
    "uncle",
    "aunt",
    "other",
  ] as const,
  {
    father: "الأب",
    mother: "الأم",
    brother: "الأخ",
    sister: "الأخت",
    grandfather: "الجد",
    grandmother: "الجدة",
    uncle: "العم/الخال",
    aunt: "العمة/الخالة",
    other: "أخرى",
  },
);

export const PROGRESS_TRENDS = defineOptions(
  ["up", "stable", "down"] as const,
  {
    up: "متقدم",
    stable: "ثابت",
    down: "متراجع",
  },
);

export const TAJWEED_RATINGS = defineOptions(
  ["excellent", "very_good", "good", "needs_practice"] as const,
  {
    excellent: "ممتاز",
    very_good: "جيد جدًا",
    good: "جيد",
    needs_practice: "يحتاج تدريب",
  },
);

export const ROLE_NAMES_AR: Record<string, string> = {
  center_admin: "مدير مركز",
  branch_admin: "مدير فرع",
  teacher: "مشرف",
};

const RAW_SURAHS: ReadonlyArray<readonly [number, string, number]> = [
  [1, "الفاتحة", 7],
  [2, "البقرة", 286],
  [3, "آل عمران", 200],
  [4, "النساء", 176],
  [5, "المائدة", 120],
  [6, "الأنعام", 165],
  [7, "الأعراف", 206],
  [8, "الأنفال", 75],
  [9, "التوبة", 129],
  [10, "يونس", 109],
  [11, "هود", 123],
  [12, "يوسف", 111],
  [13, "الرعد", 43],
  [14, "ابراهيم", 52],
  [15, "الحجر", 99],
  [16, "النحل", 128],
  [17, "الإسراء", 111],
  [18, "الكهف", 110],
  [19, "مريم", 98],
  [20, "طه", 135],
  [21, "الأنبياء", 112],
  [22, "الحج", 78],
  [23, "المؤمنون", 118],
  [24, "النور", 64],
  [25, "الفرقان", 77],
  [26, "الشعراء", 227],
  [27, "النمل", 93],
  [28, "القصص", 88],
  [29, "العنكبوت", 69],
  [30, "الروم", 60],
  [31, "لقمان", 34],
  [32, "السجدة", 30],
  [33, "الأحزاب", 73],
  [34, "سبإ", 54],
  [35, "فاطر", 45],
  [36, "يس", 83],
  [37, "الصافات", 182],
  [38, "ص", 88],
  [39, "الزمر", 75],
  [40, "غافر", 85],
  [41, "فصلت", 54],
  [42, "الشورى", 53],
  [43, "الزخرف", 89],
  [44, "الدخان", 59],
  [45, "الجاثية", 37],
  [46, "الأحقاف", 35],
  [47, "محمد", 38],
  [48, "الفتح", 29],
  [49, "الحجرات", 18],
  [50, "ق", 45],
  [51, "الذاريات", 60],
  [52, "الطور", 49],
  [53, "النجم", 62],
  [54, "القمر", 55],
  [55, "الرحمن", 78],
  [56, "الواقعة", 96],
  [57, "الحديد", 29],
  [58, "المجادلة", 22],
  [59, "الحشر", 24],
  [60, "الممتحنة", 13],
  [61, "الصف", 14],
  [62, "الجمعة", 11],
  [63, "المنافقون", 11],
  [64, "التغابن", 18],
  [65, "الطلاق", 12],
  [66, "التحريم", 12],
  [67, "الملك", 30],
  [68, "القلم", 52],
  [69, "الحاقة", 52],
  [70, "المعارج", 44],
  [71, "نوح", 28],
  [72, "الجن", 28],
  [73, "المزمل", 20],
  [74, "المدثر", 56],
  [75, "القيامة", 40],
  [76, "الانسان", 31],
  [77, "المرسلات", 50],
  [78, "النبإ", 40],
  [79, "النازعات", 46],
  [80, "عبس", 42],
  [81, "التكوير", 29],
  [82, "الإنفطار", 19],
  [83, "المطففين", 36],
  [84, "الإنشقاق", 25],
  [85, "البروج", 22],
  [86, "الطارق", 17],
  [87, "الأعلى", 19],
  [88, "الغاشية", 26],
  [89, "الفجر", 30],
  [90, "البلد", 20],
  [91, "الشمس", 15],
  [92, "الليل", 21],
  [93, "الضحى", 11],
  [94, "الشرح", 8],
  [95, "التين", 8],
  [96, "العلق", 19],
  [97, "القدر", 5],
  [98, "البينة", 8],
  [99, "الزلزلة", 8],
  [100, "العاديات", 11],
  [101, "القارعة", 11],
  [102, "التكاثر", 8],
  [103, "العصر", 3],
  [104, "الهمزة", 9],
  [105, "الفيل", 5],
  [106, "قريش", 4],
  [107, "الماعون", 7],
  [108, "الكوثر", 3],
  [109, "الكافرون", 6],
  [110, "النصر", 3],
  [111, "المسد", 5],
  [112, "الإخلاص", 4],
  [113, "الفلق", 5],
  [114, "الناس", 6],
];

export interface SurahInfo {
  number: number;
  name: string;
  ayahs: number;
}

export const QURAN_SURAHS: SurahInfo[] = RAW_SURAHS.map(
  ([number, name, ayahs]) => ({
    number,
    name,
    ayahs,
  }),
);

const SURAH_BY_NUMBER = new Map(QURAN_SURAHS.map((s) => [s.number, s]));

export function getSurah(n: number): SurahInfo | undefined {
  return SURAH_BY_NUMBER.get(n);
}

export function isValidAyah(surah: number, ayah: number): boolean {
  const s = SURAH_BY_NUMBER.get(surah);
  return !!s && Number.isInteger(ayah) && ayah >= 1 && ayah <= s.ayahs;
}

// مخططات الطلاب المشتركة (عميل + سيرفر) — مبنية على القوالب والثوابت.
import { z } from "zod";
import {
  GENDERS,
  GUARDIAN_RELATIONS,
  LEVELS,
  getSurah,
  isValidAyah,
} from "@/constants/students";
import {
  emptyTo,
  nameRule,
  optionalPhoneRule,
  optionalString,
  phoneRule,
} from "./common";

// تاريخ YYYY-MM-DD فقط (يُحوَّل لظهر UTC في الخدمة بلا انزياح يوم).
export const birthDateRule = emptyTo(
  z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "التاريخ غير صحيح")
    .optional(),
);

export function toBirthDate(s: string | undefined): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(Date.UTC(y!, m! - 1, d!, 12));
  return Number.isNaN(dt.getTime()) ? null : dt;
}

const quranPositionRule = z
  .object({
    surah: z.number().int().min(1).max(114),
    ayah: z.number().int().min(1, "الآية تبدأ من 1"),
  })
  .superRefine((v, ctx) => {
    if (!isValidAyah(v.surah, v.ayah)) {
      const s = getSurah(v.surah);
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ayah"],
        message: s ? `عدد آيات السورة: ${s.ayahs}` : "السورة غير صحيحة",
      });
    }
  });

export const guardianRule = z.object({
  relation: GUARDIAN_RELATIONS.zod(),
  phone: phoneRule("رقم ولي الأمر"),
});

// الصف الفارغ كليًا (هاتف فارغ) يُحذف قبل التحقق — لا يُعد خطأً.
// الصف المعبأ جزئيًا (هاتف غير فارغ) يُتحقق منه كاملًا.
function stripEmptyGuardians(v: unknown) {
  if (!Array.isArray(v)) return v;
  return v.filter(
    (g) =>
      typeof g === "object" &&
      g !== null &&
      String((g as { phone?: unknown }).phone ?? "").trim() !== "",
  );
}

const guardiansArrayRule = z
  .array(guardianRule)
  .max(4, "4 أولياء كحد أقصى");

// z.preprocess يوسّع الدخل لـ unknown في الاستدلال، فإعادة الصب تحفظ النوع الساكن.
const guardiansFormRule = z.preprocess(
  stripEmptyGuardians,
  guardiansArrayRule,
) as unknown as typeof guardiansArrayRule;

const imageRule = z.object({
  url: z.string().url("رابط الصورة غير صحيح"),
  publicId: z.string().min(1),
});

const baseFields = {
  name: nameRule,
  gender: GENDERS.zod(),
  level: LEVELS.zod().default("beginner"),
  birthDate: birthDateRule,
  phone: optionalPhoneRule("هاتف الطالب"),
  address: optionalString(200),
  notes: optionalString(1000),
  guardians: guardiansFormRule.default([]),
  image: imageRule.optional(),
};

export const createStudentSchema = z.object({
  ...baseFields,
  branchId: z.string().optional(),
  hifz: quranPositionRule.optional(),
  confirmDuplicate: z.boolean().optional(),
});
export type CreateStudentInput = z.infer<typeof createStudentSchema>;

export const updateStudentSchema = z.object({
  ...baseFields,
  level: LEVELS.zod(),
  hifzPosition: quranPositionRule.optional(),
  confirmDuplicate: z.boolean().optional(),
});
export type UpdateStudentInput = z.infer<typeof updateStudentSchema>;

// مخطط الفورم الموحد (إنشاء/تعديل): الحقلان معًا اختياريان، والواجهة تعرض أحدهما.
// الأكشن يحوّل القيم إلى مخطط الإنشاء أو التعديل قبل الخدمة.
export const studentFormSchema = z.object({
  ...baseFields,
  level: LEVELS.zod(),
  guardians: guardiansFormRule,
  branchId: z.string().optional(),
  hifz: quranPositionRule.optional(),
  hifzPosition: quranPositionRule.optional(),
  confirmDuplicate: z.boolean().optional(),
});
export type StudentFormInput = z.infer<typeof studentFormSchema>;

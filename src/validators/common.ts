// قوالب تحقق zod مشتركة برسائل عربية — تُستخدم في العميل (RHF) والسيرفر معًا.
import { z } from "zod";

// حوّل "" إلى undefined قبل أي تحقق (الحقل الاختياري الفارغ ليس "").
export function emptyTo<T extends z.ZodOptional<z.ZodTypeAny>>(schema: T): T {
  return z.preprocess((v) => (v === "" || v === null ? undefined : v), schema) as unknown as T;
}

export const emailRule = z
  .string()
  .trim()
  .min(1, "البريد الإلكتروني مطلوب")
  .email("البريد الإلكتروني غير صحيح")
  .max(120, "البريد الإلكتروني طويل جدًا")
  .toLowerCase();

export const passwordRule = z
  .string()
  .min(8, "كلمة المرور 8 أحرف على الأقل")
  .max(100, "كلمة المرور طويلة جدًا");

export const confirmPasswordRule = z.string().min(1, "تأكيد كلمة المرور مطلوب");

// غلّف أي object فيه password + confirmPassword به للتحقق من التطابق.
export function confirmPasswordMatches<S extends z.ZodTypeAny>(schema: S) {
  return schema.superRefine((val, ctx) => {
    const v = val as { password?: unknown; confirmPassword?: unknown };
    if (v.password !== v.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "كلمتا المرور غير متطابقتين",
      });
    }
  });
}

// موبايل مصري: 010/011/012/015 مع +20 أو 0020 أو بدون.
export const phoneRule = (label = "رقم التواصل") =>
  z
    .string()
    .trim()
    .min(1, `${label} مطلوب`)
    .max(20, `${label} طويل جدًا`)
    .regex(/^(?:\+?20|0020)?0?1[0-25]\d{8}$/, `${label} غير صحيح`);

export const optionalPhoneRule = (label = "رقم التواصل") =>
  emptyTo(phoneRule(label).optional());

export const requiredString = (label: string, max = 80) =>
  z.string().trim().min(1, `${label} مطلوب`).max(max, `${label} طويل جدًا`);

export const nameRule = requiredString("الاسم", 60);

export const optionalString = (max = 200) =>
  emptyTo(z.string().trim().max(max, "النص طويل جدًا").optional());

const toNumber = (v: unknown) => (v === "" || v === null || v === undefined ? undefined : Number(v));

// رقم إجباري يقبل مدخلات رقمية (نص أو رقم) ويميز الفارغ عن الصفر.
export const numberRule = (label: string, opts: { min?: number; max?: number } = {}) => {
  let inner = z.number({
    required_error: `${label} مطلوب`,
    invalid_type_error: `${label} يجب أن يكون رقمًا`,
  });
  if (opts.min !== undefined) inner = inner.min(opts.min, `${label} لا يقل عن ${opts.min}`);
  if (opts.max !== undefined) inner = inner.max(opts.max, `${label} لا يزيد عن ${opts.max}`);
  return z.preprocess(toNumber, inner);
};

export const optionalNumberRule = (label: string, opts?: { min?: number; max?: number }) =>
  emptyTo(numberRule(label, opts).optional());

export const selectRequired = (label: string) => z.string().min(1, `اختر ${label}`);

export const inviteCodeRule = z
  .string()
  .trim()
  .min(6, "الكود غير مكتمل")
  .max(16, "الكود غير صحيح");

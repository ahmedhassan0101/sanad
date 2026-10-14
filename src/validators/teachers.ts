// مخططات المعلمين المشتركة (عميل + سيرفر) — نفس نمط مخططات الطلاب.
import { z } from "zod";
import { nameRule, optionalPhoneRule, optionalString } from "./common";

const imageRule = z.object({
  url: z.string().url("رابط الصورة غير صحيح"),
  publicId: z.string().min(1),
});

const baseFields = {
  name: nameRule,
  phone: optionalPhoneRule("هاتف المعلم"),
  notes: optionalString(1000),
  image: imageRule.optional(),
};

export const createTeacherSchema = z.object({
  ...baseFields,
  branchId: z.string().optional(),
  confirmDuplicate: z.boolean().optional(),
});
export type CreateTeacherInput = z.infer<typeof createTeacherSchema>;

export const updateTeacherSchema = z.object({
  ...baseFields,
  confirmDuplicate: z.boolean().optional(),
});
export type UpdateTeacherInput = z.infer<typeof updateTeacherSchema>;

// مخطط الفورم الموحد (إنشاء/تعديل). الأكشن يحوّل القيم إلى مخطط الإنشاء أو التعديل.
export const teacherFormSchema = z.object({
  ...baseFields,
  branchId: z.string().optional(),
  confirmDuplicate: z.boolean().optional(),
});
export type TeacherFormInput = z.infer<typeof teacherFormSchema>;

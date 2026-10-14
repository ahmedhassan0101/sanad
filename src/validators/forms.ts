// schemas الفورمات: نفس القواعد في العميل (RHF) والسيرفر (actions) حتى لا تنحرف.
import { z } from "zod";
import {
  emailRule,
  inviteCodeRule,
  nameRule,
  optionalString,
  passwordRule,
  phoneRule,
} from "./common";

export const loginSchema = z.object({
  email: emailRule,
  password: z.string().min(1, "كلمة المرور مطلوبة"),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const registerSchema = z.object({
  name: nameRule,
  email: emailRule,
  password: passwordRule,
});
export type RegisterInput = z.infer<typeof registerSchema>;

export const forgotSchema = z.object({ email: emailRule });
export type ForgotInput = z.infer<typeof forgotSchema>;

export const resetSchema = z.object({ password: passwordRule });
export type ResetInput = z.infer<typeof resetSchema>;

export const createCenterSchema = z.object({
  name: z.string().trim().min(2, "اسم المركز مطلوب").max(80, "اسم المركز طويل جدًا"),
  contactPhone: phoneRule(),
  addressText: optionalString(200),
  programs: z.array(z.string().min(1)).min(1, "اختر برنامجًا واحدًا على الأقل"),
  customProgram: optionalString(40),
});
export type CreateCenterInput = z.infer<typeof createCenterSchema>;

export const enterCodeSchema = z.object({ code: inviteCodeRule });
export type EnterCodeInput = z.infer<typeof enterCodeSchema>;

export const inviteFormSchema = z.object({
  role: z.enum(["center_admin", "branch_admin", "supervisor"]),
  branchId: z.string().nullable().optional(),
});
export type InviteFormInput = z.infer<typeof inviteFormSchema>;

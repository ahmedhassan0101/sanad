// أكشن طلب رابط الاستعادة: يرد دائمًا بنجاح حتى لا يكشف الحسابات.
"use server";

import { requestPasswordReset } from "@/services/auth-accounts";
import { forgotSchema, type ForgotInput } from "@/validators/forms";

export async function forgotAction(
  values: ForgotInput
): Promise<{ ok: true; message: string } | { ok: false; message: string }> {
  const parsed = forgotSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "البريد الإلكتروني غير صحيح" };
  await requestPasswordReset(parsed.data.email);
  return { ok: true, message: "إن وُجد الحساب ستصلك رسالة الاستعادة" };
}

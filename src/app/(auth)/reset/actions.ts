// أكشن الحفظ: رابط منتهي أو صالح — الرسالة عربية واضحة.
"use server";

import { redirect } from "next/navigation";
import { resetPassword } from "@/services/auth-accounts";
import { resetSchema } from "@/validators/forms";

export async function resetAction(
  email: string,
  token: string,
  values: { password: string }
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = resetSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "كلمة المرور 8 أحرف على الأقل" };
  try {
    await resetPassword(email, token, parsed.data.password);
  } catch {
    return { ok: false, message: "الرابط منتهي أو غير صالح — اطلب رابطًا جديدًا" };
  }
  redirect("/login");
}

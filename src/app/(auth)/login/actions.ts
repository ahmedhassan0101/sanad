// أكشن الدخول: يتحقق من نفس الـ schema ثم يسجل الدخول بلا إعادة تحميل.
"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/config";
import { isEmailVerified } from "@/services/auth-accounts";
import { loginSchema, type LoginInput } from "@/validators/forms";

export async function loginAction(
  values: LoginInput
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = loginSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  const res = await signIn("credentials", { ...parsed.data, redirect: false });
  if (!res || res.error) return { ok: false, message: "بيانات الدخول غير صحيحة أو الحساب موقوف" };
  redirect((await isEmailVerified(parsed.data.email)) ? "/api/resolve-org" : "/verify-pending");
}

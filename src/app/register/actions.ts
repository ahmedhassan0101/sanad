"use server";

import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/config";
import { isEmailVerified, registerAccount } from "@/services/auth-accounts";
import { registerSchema, type RegisterInput } from "@/validators/forms";

export async function registerAction(
  values: RegisterInput,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const parsed = registerSchema.safeParse(values);
  if (!parsed.success)
    return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    await registerAccount(
      parsed.data.name,
      parsed.data.email,
      parsed.data.password,
    );
  } catch (e) {
    if (e instanceof Error && e.message === "TAKEN") {
      return {
        ok: false,
        message: "هذا البريد مسجل بالفعل — سجل الدخول بدلًا من ذلك",
      };
    }
    return { ok: false, message: "تعذر إنشاء الحساب — حاول مجددًا" };
  }
  const res = await signIn("credentials", { ...parsed.data, redirect: false });
  if (!res || res.error)
    return { ok: false, message: "تم إنشاء الحساب — سجل الدخول" };
  redirect(
    (await isEmailVerified(parsed.data.email))
      ? "/api/resolve-org"
      : "/verify-pending",
  );
}

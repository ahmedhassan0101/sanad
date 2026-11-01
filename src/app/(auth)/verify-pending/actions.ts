// src\app\(auth)\verify-pending\actions.ts
// Resend verification link (limited to 3 per hour).
"use server";

import { auth } from "@/lib/auth/config";
import { resendVerification } from "@/services/auth-accounts";
import { redirect } from "next/navigation";

export async function resendAction(): Promise<
  { ok: true } | { ok: false; message: string }
> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  try {
    await resendVerification(session.user.id);
  } catch (e) {
    const m = e instanceof Error ? e.message : "";
    if (m.startsWith("RATE_LIMITED"))
      return { ok: false, message: "تجاوزت الحد — أعد المحاولة بعد ساعة" };
    if (m === "ALREADY_VERIFIED") redirect("/onboarding");
    return { ok: false, message: "تعذر الإرسال — حاول مجددًا" };
  }
  return { ok: true };
}

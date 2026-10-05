// أكشن الانضمام: نفس الـ schema ثم استهلاك ذري للكود.
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { consumeInvite } from "@/services/invites";
import { enterCodeSchema, type EnterCodeInput } from "@/validators/forms";

export async function enterCodeAction(
  values: EnterCodeInput
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const parsed = enterCodeSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "الكود غير مكتمل" };
  try {
    const { orgId } = await consumeInvite(session.user.id, parsed.data.code);
    (await cookies()).set("active_org", orgId, { httpOnly: true, sameSite: "lax", path: "/" });
  } catch (e) {
    const message = e instanceof Error ? e.message : "";
    return { ok: false, message: message || "الكود غير صحيح أو منتهي أو مستخدم" };
  }
  redirect("/dashboard");
}

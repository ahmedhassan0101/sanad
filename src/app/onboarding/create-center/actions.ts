// أكشن الإنشاء: نفس الـ schema ثم transaction ثم تثبيت المركز النشط.
"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { createCenter } from "@/services/orgs";
import { setActiveOrgCookie } from "@/services/org-selection";
import { createCenterSchema, type CreateCenterInput } from "@/validators/forms";

export async function createCenterAction(
  values: CreateCenterInput
): Promise<{ ok: true } | { ok: false; message: string }> {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const parsed = createCenterSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    const { orgId } = await createCenter(session.user.id, {
      name: parsed.data.name,
      contactPhone: parsed.data.contactPhone,
      addressText: parsed.data.addressText,
    });
    await setActiveOrgCookie(orgId);
  } catch (e) {
    const message = e instanceof Error ? e.message.replace(/^(VALIDATION|FORBIDDEN):\s*/, "") : "";
    return { ok: false, message: message || "تعذر إنشاء المركز — حاول مجددًا" };
  }
  redirect("/dashboard");
}

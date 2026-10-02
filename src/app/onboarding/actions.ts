// تثبيت المركز النشط في الكوكي بعد التحقق من العضوية.
"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { activateOrg } from "@/services/org-selection";

export async function setActiveOrg(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  try {
    const { orgId } = await activateOrg(session.user.id, String(formData.get("orgId") ?? ""));
    (await cookies()).set("active_org", orgId, { httpOnly: true, sameSite: "lax", path: "/" });
  } catch {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}

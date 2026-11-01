// تثبيت المركز النشط في الكوكي بعد التحقق من العضوية.
"use server";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { activateOrg, setActiveOrgCookie } from "@/services/org-selection";

export async function setActiveOrg(formData: FormData) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  try {
    const { orgId } = await activateOrg(
      session.user.id,
      String(formData.get("orgId") ?? ""),
    );
    await setActiveOrgCookie(orgId);
  } catch {
    redirect("/onboarding");
  }
  redirect("/dashboard");
}

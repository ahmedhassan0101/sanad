// src\app\api\resolve-org\route.ts
// توجيه ما بعد الدخول: يثبت الكوكي هنا (لا يعمل cookies().set في المكوّنات).
// post-login routing: sets the cookie here (cookies().set doesn't work in components).
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { resolvePostLogin, setActiveOrgCookie } from "@/services/org-selection";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const resolved = await resolvePostLogin(session.user.id);
  if (resolved.kind === "single") {
    await setActiveOrgCookie(resolved.orgId);
    redirect("/dashboard");
  }
  redirect(resolved.kind === "many" ? "/select-org" : "/onboarding");
}

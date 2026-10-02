// شاشة إدخال كود الدعوة للانضمام لمركز.
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { consumeInvite } from "@/services/invites";

export default async function EnterCodePage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  async function action(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    try {
      const { orgId } = await consumeInvite(session.user.id, String(formData.get("code") ?? ""));
      (await cookies()).set("active_org", orgId, { httpOnly: true, sameSite: "lax", path: "/" });
    } catch {
      redirect("/onboarding/enter-code?error=1");
    }
    redirect("/dashboard");
  }
  return (
    <main>
      <h1>عندي كود دعوة</h1>
      {sp.error && <p>الكود غير صحيح أو منتهي أو مستخدم</p>}
      <form action={action}>
        <label>
          الكود
          <input name="code" required dir="ltr" placeholder="مثال: K7M2P9QA" />
        </label>
        <button type="submit">انضمام</button>
      </form>
      <p>
        <Link href="/onboarding">رجوع</Link>
      </p>
    </main>
  );
}

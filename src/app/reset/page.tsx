// تعيين كلمة مرور جديدة بالرابط (ويخرج من كل الأجهزة).
import Link from "next/link";
import { redirect } from "next/navigation";
import { resetPassword } from "@/services/auth-accounts";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email = "", token = "" } = await searchParams;
  async function action(formData: FormData) {
    "use server";
    const em = String(formData.get("email") ?? "");
    const tk = String(formData.get("token") ?? "");
    try {
      await resetPassword(em, tk, String(formData.get("password") ?? ""));
    } catch {
      redirect(`/reset?email=${encodeURIComponent(em)}&token=${encodeURIComponent(tk)}&error=1`);
    }
    redirect("/login");
  }
  return (
    <main>
      <h1>كلمة مرور جديدة</h1>
      <form action={action}>
        <input type="hidden" name="email" value={email} />
        <input type="hidden" name="token" value={token} />
        <label>
          كلمة المرور الجديدة
          <input name="password" type="password" required minLength={8} dir="ltr" />
        </label>
        <button type="submit">حفظ</button>
      </form>
      <p>
        <Link href="/login">عودة للدخول</Link>
      </p>
    </main>
  );
}

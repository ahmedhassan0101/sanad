// شاشة الدخول: إيميل/باسورد أو Google.
import { AuthError } from "next-auth";
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/config";

const googleEnabled = !!process.env.GOOGLE_CLIENT_ID;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  async function action(formData: FormData) {
    "use server";
    try {
      await signIn("credentials", {
        email: formData.get("email"),
        password: formData.get("password"),
        redirectTo: "/onboarding",
      });
    } catch (e) {
      if (e instanceof AuthError) redirect("/login?error=1");
      throw e;
    }
  }
  async function googleAction() {
    "use server";
    await signIn("google", { redirectTo: "/onboarding" });
  }
  return (
    <main>
      <h1>تسجيل الدخول</h1>
      {sp.error && <p>بيانات الدخول غير صحيحة أو الحساب موقوف</p>}
      {googleEnabled && (
        <form action={googleAction}>
          <button type="submit">الدخول بـ Google</button>
        </form>
      )}
      <form action={action}>
        <label>
          الإيميل
          <input name="email" type="email" required dir="ltr" />
        </label>
        <label>
          كلمة المرور
          <input name="password" type="password" required dir="ltr" />
        </label>
        <button type="submit">دخول</button>
      </form>
      <p>
        <Link href="/register">حساب جديد</Link> · <Link href="/forgot">نسيت كلمة المرور؟</Link>
      </p>
    </main>
  );
}

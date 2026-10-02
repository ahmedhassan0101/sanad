// شاشة إنشاء حساب جديد بالإيميل.
import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/lib/auth/config";
import { registerAccount } from "@/services/auth-accounts";

export default function RegisterPage() {
  async function action(formData: FormData) {
    "use server";
    const password = String(formData.get("password") ?? "");
    const email = String(formData.get("email") ?? "");
    try {
      await registerAccount(String(formData.get("name") ?? ""), email, password);
    } catch (e) {
      if (e instanceof Error && e.message === "TAKEN") redirect("/register?error=taken");
      redirect("/register?error=1");
    }
    await signIn("credentials", { email, password, redirectTo: "/onboarding" });
  }
  return (
    <main>
      <h1>حساب جديد</h1>
      <form action={action}>
        <label>
          الاسم
          <input name="name" required maxLength={60} />
        </label>
        <label>
          الإيميل
          <input name="email" type="email" required dir="ltr" />
        </label>
        <label>
          كلمة المرور (8 حروف على الأقل)
          <input name="password" type="password" required minLength={8} dir="ltr" />
        </label>
        <button type="submit">إنشاء الحساب</button>
      </form>
      <p>
        <Link href="/login">عندي حساب بالفعل</Link>
      </p>
    </main>
  );
}

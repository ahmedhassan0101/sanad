// طلب رابط تعيين كلمة مرور جديدة.
import Link from "next/link";
import { redirect } from "next/navigation";
import { requestPasswordReset } from "@/services/auth-accounts";

export default function ForgotPage() {
  async function action(formData: FormData) {
    "use server";
    await requestPasswordReset(String(formData.get("email") ?? ""));
    redirect("/forgot?sent=1");
  }
  return (
    <main>
      <h1>نسيت كلمة المرور</h1>
      <form action={action}>
        <label>
          الإيميل
          <input name="email" type="email" required dir="ltr" />
        </label>
        <button type="submit">إرسال الرابط</button>
      </form>
      <p>
        <Link href="/login">عودة للدخول</Link>
      </p>
    </main>
  );
}

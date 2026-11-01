// طلب رابط تعيين كلمة مرور جديدة.
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ForgotForm } from "./form";

export default function ForgotPage() {
  return (
    <AuthShell title="نسيت كلمة المرور" description="أدخل بريدك وسنرسل لك رابط الاستعادة">
      <ForgotForm />
      <p className="text-center text-sm">
        <Link href="/login" className="underline underline-offset-4">
          عودة للدخول
        </Link>
      </p>
    </AuthShell>
  );
}

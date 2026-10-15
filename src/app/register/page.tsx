// شاشة إنشاء حساب جديد.
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { RegisterForm } from "./form";

export default function RegisterPage() {
  return (
    <AuthShell title="حساب جديد" description="أنشئ حسابك في دقيقة واحدة">
      <RegisterForm />
      <p className="text-center text-sm">
        <Link href="/login" className="underline underline-offset-4">
          عندي حساب بالفعل
        </Link>
      </p>
    </AuthShell>
  );
}

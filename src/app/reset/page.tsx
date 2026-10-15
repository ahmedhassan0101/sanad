// تعيين كلمة مرور جديدة بالرابط (ويخرج من كل الأجهزة).
import Link from "next/link";
import { AuthShell } from "@/components/auth-shell";
import { ResetForm } from "./form";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email = "", token = "" } = await searchParams;
  return (
    <AuthShell title="كلمة مرور جديدة" description="اختر كلمة مرور قوية ولا تشاركها">
      <ResetForm email={email} token={token} />
      <p className="text-center text-sm">
        <Link href="/login" className="underline underline-offset-4">
          عودة للدخول
        </Link>
      </p>
    </AuthShell>
  );
}

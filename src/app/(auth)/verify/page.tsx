// src\app\(auth)\verify\page.tsx
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { AuthShell } from "@/components/auth-shell";
import { verifyEmailToken } from "@/services/auth-accounts";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email = "", token = "" } = await searchParams;
  const done = await verifyEmailToken(email, token);
  if (done) redirect("/onboarding");
  return (
    <AuthShell
      title={done ? "تم تفعيل بريدك بنجاح" : "الرابط غير صالح أو منتهي"}
      description={done ? undefined : "اطلب رابطًا جديدًا أو تحقق من الرابط"}
    >
      <Link href={done ? "/onboarding" : "/login"} className={buttonVariants()}>
        {done ? "أكمل إلى لوحتك" : "عودة للدخول"}
      </Link>
    </AuthShell>
  );
}

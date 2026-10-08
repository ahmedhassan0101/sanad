// صفحة تفعيل الإيميل من الرابط.
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>{done ? "تم تفعيل بريدك بنجاح" : "الرابط غير صالح أو منتهي"}</CardTitle>
          {!done && <CardDescription>اطلب رابطًا جديدًا أو تحقق من الرابط</CardDescription>}
        </CardHeader>
        <CardContent>
          <Link href={done ? "/onboarding" : "/login"} className={buttonVariants()}>
            {done ? "أكمل إلى لوحتك" : "عودة للدخول"}
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

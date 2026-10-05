// تعيين كلمة مرور جديدة بالرابط (ويخرج من كل الأجهزة).
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ResetForm } from "./form";

export default async function ResetPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email = "", token = "" } = await searchParams;
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>كلمة مرور جديدة</CardTitle>
          <CardDescription>اختر كلمة مرور قوية ولا تشاركها</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ResetForm email={email} token={token} />
          <p className="text-center text-sm">
            <Link href="/login" className="underline underline-offset-4">
              عودة للدخول
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/onboarding");
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle className="text-2xl">سَنَد</CardTitle>
          <CardDescription>نظام إدارة مراكز التحفيظ</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          <Link href="/login" className={buttonVariants()}>
            تسجيل الدخول
          </Link>
          <Link href="/register" className={buttonVariants({ variant: "outline" })}>
            حساب جديد
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

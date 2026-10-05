// طلب رابط تعيين كلمة مرور جديدة.
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ForgotForm } from "./form";

export default function ForgotPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>نسيت كلمة المرور</CardTitle>
          <CardDescription>أدخل بريدك وسنرسل لك رابط الاستعادة</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <ForgotForm />
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

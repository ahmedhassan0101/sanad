// شاشة الدخول: إيميل/باسورد أو Google.
import Link from "next/link";
import { signIn } from "@/lib/auth/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LoginForm } from "./form";

const googleEnabled = !!process.env.GOOGLE_CLIENT_ID;

export default function LoginPage() {
  async function googleAction() {
    "use server";
    await signIn("google", { redirectTo: "/api/resolve-org" });
  }
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>تسجيل الدخول</CardTitle>
          <CardDescription>أدخل بياناتك للمتابعة إلى لوحتك</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {googleEnabled && (
            <form action={googleAction}>
              <Button type="submit" variant="outline" className="w-full">
                الدخول بـ Google
              </Button>
            </form>
          )}
          <LoginForm />
          <p className="text-center text-sm">
            <Link href="/register" className="underline underline-offset-4">
              حساب جديد
            </Link>{" "}
            ·{" "}
            <Link href="/forgot" className="underline underline-offset-4">
              نسيت كلمة المرور؟
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

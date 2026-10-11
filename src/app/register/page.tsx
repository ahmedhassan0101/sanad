import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RegisterForm } from "./form";

export default function RegisterPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>حساب جديد</CardTitle>
          <CardDescription>أنشئ حسابك في دقيقة واحدة</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <RegisterForm />
          <p className="text-center text-sm">
            <Link href="/login" className="underline underline-offset-4">
              عندي حساب بالفعل
            </Link>
          </p>
        </CardContent>
      </Card>
    </main>
  );
}

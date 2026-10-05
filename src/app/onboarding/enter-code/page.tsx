// شاشة إدخال كود الدعوة للانضمام لمركز.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { EnterCodeForm } from "./form";

export default function EnterCodePage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>عندي كود دعوة</CardTitle>
          <CardDescription>اطلبه من مشرف مركزك ثم أدخله هنا</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <EnterCodeForm />
          <Link href="/onboarding" className={buttonVariants({ variant: "ghost" })}>
            رجوع
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

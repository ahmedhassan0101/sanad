// معالج إنشاء مركز: الخطوة 1 البيانات + الخطوة 2 البرامج — إرسال واحد.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CreateCenterForm } from "./form";

export default function CreateCenterPage() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>إنشاء مركز جديد</CardTitle>
          <CardDescription>الخطوة 1: البيانات الأساسية — الخطوة 2: البرامج</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <CreateCenterForm />
          <Link href="/onboarding" className={buttonVariants({ variant: "ghost" })}>
            رجوع
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

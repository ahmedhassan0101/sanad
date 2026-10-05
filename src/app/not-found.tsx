// صفحة 404: رابط واحد يرجعك للبداية.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NotFound() {
  return (
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <CardTitle>الصفحة غير موجودة</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/" className={buttonVariants()}>
            عودة للبداية
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}

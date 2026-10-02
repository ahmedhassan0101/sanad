// صفحة البداية: دخول للمسجل، وترحيب مع رابطي الدخول والتسجيل للزائر.
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";

export default async function Home() {
  const session = await auth();
  if (session?.user) redirect("/onboarding");
  return (
    <main>
      <h1>حَلْقة</h1>
      <p>نظام إدارة مراكز التحفيظ</p>
      <p>
        <Link href="/login">تسجيل الدخول</Link> · <Link href="/register">حساب جديد</Link>
      </p>
    </main>
  );
}

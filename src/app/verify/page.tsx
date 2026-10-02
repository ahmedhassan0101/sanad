// صفحة تفعيل الإيميل من الرابط.
import Link from "next/link";
import { verifyEmailToken } from "@/services/auth-accounts";

export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; token?: string }>;
}) {
  const { email = "", token = "" } = await searchParams;
  const done = await verifyEmailToken(email, token);
  if (!done) {
    return (
      <main>
        <h1>الرابط غير صالح أو منتهي</h1>
        <p>
          <Link href="/login">عودة للدخول</Link>
        </p>
      </main>
    );
  }
  return (
    <main>
      <h1>تم تفعيل بريدك بنجاح</h1>
      <p>
        <Link href="/onboarding">أكمل إلى لوحتك</Link>
      </p>
    </main>
  );
}

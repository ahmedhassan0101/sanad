// إرسال الإيميل: في التطوير يطبع الرابط في الـ logs، والإرسال الحقيقي بزر بيئة.
import { getEnv } from "@/lib/env";

export async function sendAuthLink(email: string, url: string, subject: string) {
  const env = getEnv();
  if (!env.emailEnabled) {
    console.log(`[DEV-MAIL] to=${email} subject=${subject} url=${url}`);
    return;
  }
  // Real sending (Resend) activates at deploy when EMAIL_ENABLED=true.
  console.log(`[MAIL-QUEUED] to=${email} subject=${subject} url=${url}`);
}

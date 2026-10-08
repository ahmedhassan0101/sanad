// إرسال الإيميل: حقيقي عبر Resend عند التفعيل، والرابط يُطبع أيضًا خارج الإنتاج.
import { Resend } from "resend";
import { getEnv } from "@/lib/env";

function template(title: string, body: string, url: string, action: string) {
  return `<div dir="rtl" lang="ar" style="font-family:Tahoma,Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px">
<h2>${title}</h2><p>${body}</p>
<p><a href="${url}" style="display:inline-block;background:#0A6C7E;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none">${action}</a></p>
<p style="color:#666;font-size:13px">لو الزر لا يعمل انسخ الرابط: ${url}</p></div>`;
}

export async function sendAuthLink(email: string, url: string, subject: string) {
  const env = getEnv();
  if (process.env.NODE_ENV !== "production") {
    console.log(`[DEV-MAIL] to=${email} subject=${subject} url=${url}`);
  }
  if (!env.emailEnabled) return;
  const resend = new Resend(process.env.RESEND_API_KEY);
  const from = process.env.RESEND_FROM ?? "onboarding@resend.dev";
  const { error } = await resend.emails.send({
    from,
    to: email,
    subject: `سند | ${subject}`,
    html: template("سند", subject, url, "اضغط هنا"),
  });
  if (error) throw new Error(`EMAIL_FAILED: ${error.message}`);
}

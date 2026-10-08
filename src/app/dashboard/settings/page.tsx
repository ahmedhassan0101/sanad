// الإعدادات — لغير المعلم (قريبًا).
import { redirect } from "next/navigation";
import { viewer } from "@/services/viewer";
import { PlaceholderPage } from "../placeholder";

export default async function SettingsPage() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (ctx.role === "teacher") redirect("/dashboard");
  return <PlaceholderPage title="الإعدادات — قريبًا" />;
}

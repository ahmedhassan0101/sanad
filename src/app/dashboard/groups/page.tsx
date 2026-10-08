// المجموعات — قريبًا.
import { redirect } from "next/navigation";
import { viewer } from "@/services/viewer";
import { PlaceholderPage } from "../placeholder";

export default async function GroupsPage() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  return <PlaceholderPage title="المجموعات — قريبًا" />;
}

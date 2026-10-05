// معرض المكونات (للتطوير فقط): افتحه لتتعلم استخدام كل قطعة — محجوب في الإنتاج.
import { notFound } from "next/navigation";
import { DemoSections } from "./demo";

export default function UiDemoPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DemoSections />;
}

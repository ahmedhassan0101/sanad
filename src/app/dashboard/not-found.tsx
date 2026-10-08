// صفحة غير موجودة داخل الداشبورد.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-10">
      <p>الصفحة غير موجودة</p>
      <Link href="/dashboard" className={buttonVariants()}>
        عودة للرئيسية
      </Link>
    </div>
  );
}

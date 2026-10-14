// خطأ أقسام الداشبورد: رسالة هادئة + إعادة المحاولة.
"use client";

import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";

export default function DashboardError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <EmptyState
      title="تعذر تحميل هذه الصفحة"
      description="تحقق من الاتصال ثم حاول مجددًا"
      action={
        <Button variant="outline" onClick={reset}>
          إعادة المحاولة
        </Button>
      }
    />
  );
}

// حالة فارغة موحدة: عنوان + وصف + زر اختياري.
import type { ReactNode } from "react";
import { Card, CardContent } from "./ui/card";

export function EmptyState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-2 py-10 text-center">
        <p className="font-medium">{title}</p>
        {description && <p className="text-sm text-muted-foreground">{description}</p>}
        {action}
      </CardContent>
    </Card>
  );
}

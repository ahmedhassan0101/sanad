// رأس الصفحة وحاويتها: عرض أقصى واحد لكل الشاشات (الفورم أضيق من الجدول).
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function PageContainer({
  children,
  narrow,
}: {
  children: ReactNode;
  narrow?: boolean;
}) {
  return (
    <div className={cn("page-container", narrow ? "max-w-3xl" : "max-w-7xl")}>
      {children}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">{title}</h1>
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

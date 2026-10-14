// شارات الحالة الموحدة: خلفية مطفية ونص داكن — كل الحالات من التوكنز فقط.
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const TONES = {
  neutral: "bg-muted text-muted-foreground",
  success: "bg-success-muted text-success-muted-foreground",
  warning: "bg-warning-muted text-warning-muted-foreground",
  danger: "bg-destructive-muted text-destructive-muted-foreground",
  info: "bg-info-muted text-info-muted-foreground",
  present: "bg-present-muted text-present-muted-foreground",
  absent: "bg-absent-muted text-absent-muted-foreground",
  late: "bg-late-muted text-late-muted-foreground",
  excused: "bg-excused-muted text-excused-muted-foreground",
} as const;

export type StatusTone = keyof typeof TONES;

export function StatusBadge({
  tone = "neutral",
  children,
}: {
  tone?: StatusTone;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-h-7 items-center rounded-full px-2.5 text-xs font-medium whitespace-nowrap",
        TONES[tone],
      )}
    >
      {children}
    </span>
  );
}

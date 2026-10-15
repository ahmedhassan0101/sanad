// عناصر الهوية: الشعار والنقش الهندسي والأفاتار — كلها currentColor وتوكنز فقط.
import { cn } from "@/lib/utils";

// علامة سند: نجمة ثمانية (خاتم) بخط واحد بسيط.
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="none" className={className} aria-hidden="true">
      <rect x="8" y="8" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" />
      <rect x="8" y="8" width="16" height="16" rx="2" stroke="currentColor" strokeWidth="2.5" transform="rotate(45 16 16)" />
      <circle cx="16" cy="16" r="2.5" fill="currentColor" />
    </svg>
  );
}

export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <LogoMark className="size-8" />
      <span className="text-2xl font-extrabold tracking-heading">سند</span>
    </span>
  );
}

// نقش هندسي خافت: يُستخدم مرة واحدة فقط في شاشات Signature.
export function PatternTile({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
      className={className}
    >
      <defs>
        <pattern id="sanad-star" width="64" height="64" patternUnits="userSpaceOnUse">
          <rect x="18" y="18" width="28" height="28" rx="1" />
          <rect x="18" y="18" width="28" height="28" rx="1" transform="rotate(45 32 32)" />
          <circle cx="32" cy="32" r="3" fill="currentColor" stroke="none" />
          <circle cx="0" cy="0" r="2" fill="currentColor" stroke="none" />
          <circle cx="64" cy="0" r="2" fill="currentColor" stroke="none" />
          <circle cx="0" cy="64" r="2" fill="currentColor" stroke="none" />
          <circle cx="64" cy="64" r="2" fill="currentColor" stroke="none" />
        </pattern>
      </defs>
      <rect width="64" height="64" fill="url(#sanad-star)" stroke="none" />
    </svg>
  );
}

const AVATAR_TONES = [
  "bg-success-muted text-success-muted-foreground",
  "bg-warning-muted text-warning-muted-foreground",
  "bg-info-muted text-info-muted-foreground",
  "bg-accent text-accent-foreground",
] as const;

// أفاتار بحرف الاسم — لون ثابت لكل اسم من التوكنز.
export function Avatar({ name, className }: { name: string; className?: string }) {
  const trimmed = name.trim();
  const initial = trimmed ? [...trimmed][0]! : "؟";
  let hash = 0;
  for (const ch of trimmed) hash = (hash * 31 + ch.codePointAt(0)!) % 997;
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length]!;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold",
        tone,
        className,
      )}
    >
      {initial}
    </span>
  );
}

// رقاقة أيقونة: للأيقونات الدلالية فقط (الحالات)، لا للزينة.
export function IconChip({
  tone = "neutral",
  children,
  className,
}: {
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    neutral: "bg-muted text-muted-foreground",
    success: "bg-success-muted text-success-muted-foreground",
    warning: "bg-warning-muted text-warning-muted-foreground",
    danger: "bg-destructive-muted text-destructive-muted-foreground",
    info: "bg-info-muted text-info-muted-foreground",
  } as const;
  return (
    <span
      aria-hidden="true"
      className={cn("inline-flex size-10 shrink-0 items-center justify-center rounded-lg", tones[tone], className)}
    >
      {children}
    </span>
  );
}

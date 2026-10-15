// إطار شاشات البداية: شعار + شريط نقش + خطوات + بطاقة — توقيع واحد لكل الشاشة.
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Logo, PatternTile } from "./brand";
import { cn } from "@/lib/utils";

export function StepDots({ steps, current }: { steps: string[]; current: number }) {
  return (
    <ol className="flex items-center gap-2" aria-label="خطوات">
      {steps.map((s, i) => (
        <li key={s} className="flex flex-1 items-center gap-2 last:flex-none">
          <span
            aria-current={i === current ? "step" : undefined}
            className={cn(
              "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold",
              i < current
                ? "bg-success-muted text-success-muted-foreground"
                : i === current
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground",
            )}
          >
            {i + 1}
          </span>
          <span className={cn("text-xs", i === current ? "font-medium" : "text-muted-foreground")}>
            {s}
          </span>
          {i < steps.length - 1 && <span className="h-px flex-1 bg-border" aria-hidden="true" />}
        </li>
      ))}
    </ol>
  );
}

export function OnboardingShell({
  title,
  description,
  steps,
  current,
  children,
}: {
  title: string;
  description?: string;
  steps?: string[];
  current?: number;
  children: ReactNode;
}) {
  return (
    <main className="flex min-h-svh flex-col items-center bg-background px-4 py-8">
      <div className="flex w-full max-w-md flex-col gap-6">
        <div className="flex flex-col items-center gap-3">
          <Logo className="text-primary" />
          <div className="relative h-10 w-full overflow-hidden rounded-lg bg-primary">
            <PatternTile className="absolute inset-0 size-full text-primary-foreground opacity-10" />
          </div>
        </div>
        {steps && current !== undefined && <StepDots steps={steps} current={current} />}
        <Card className="shadow-elevation-1">
          <CardHeader>
            <CardTitle className="text-heading-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}

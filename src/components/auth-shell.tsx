// إطار شاشات الدخول: نموذج + لوحة علامة (ديسكتوب)، وبطاقة مركزية (موبايل).
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Logo, PatternTile } from "./brand";

export function AuthShell({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="grid min-h-svh md:grid-cols-2">
      <div className="relative hidden flex-col justify-between overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <PatternTile className="pointer-events-none absolute inset-0 size-full text-primary-foreground opacity-10" />
        <Logo />
        <div className="relative flex flex-col gap-2">
          <p className="text-display-lg font-extrabold leading-snug">إدارة مركز التحفيظ بهدوء</p>
          <p className="max-w-sm text-sm opacity-90">
            طلاب ومعلمون وحضور وتقارير — كل شيء في مكان واحد، من الجوال أو الحاسوب.
          </p>
        </div>
        <p className="relative text-xs opacity-70">سند — لمراكز تحفيظ القرآن</p>
      </div>
      <div className="flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-sm border-0 shadow-none md:border md:shadow-elevation-1">
          <CardHeader>
            <Logo className="mb-2 text-primary md:hidden" />
            <CardTitle className="text-display-lg">{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </CardHeader>
          <CardContent className="flex flex-col gap-4">{children}</CardContent>
        </Card>
      </div>
    </main>
  );
}

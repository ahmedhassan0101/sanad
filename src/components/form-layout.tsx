// هيكل الفورم: حاوية ضيقة + أقسام ببطاقات + شريط إجراءات واضح.
import type { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { PageContainer } from "./page-header";

export function FormLayout({ children }: { children: ReactNode }) {
  return (
    <PageContainer narrow>
      <div className="flex flex-col gap-4">{children}</div>
    </PageContainer>
  );
}

export function FormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function FormActions({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap items-center gap-2">{children}</div>;
}

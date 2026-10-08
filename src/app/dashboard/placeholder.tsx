// صفحة مؤقتة: تُبنى في مرحلة لاحقة.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function PlaceholderPage({ title }: { title?: string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title ?? "قريبًا"}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">هذه الصفحة تُبنى في المرحلة الجاية.</p>
      </CardContent>
    </Card>
  );
}

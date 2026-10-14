// تبويب استيراد Excel — يُستكمل في خطوة الاستيراد.
// Placeholder مؤقت حتى لا ينكسر البناء قبلها.
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function ImportTab({
  branches,
  showBranch,
}: {
  branches: { id: string; name: string }[];
  showBranch: boolean;
}) {
  void branches;
  void showBranch;
  return (
    <Card>
      <CardHeader>
        <CardTitle>استيراد Excel</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">قريبًا — استخدم الجدول السريع الآن.</p>
      </CardContent>
    </Card>
  );
}

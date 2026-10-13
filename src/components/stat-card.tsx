// بطاقة رقم واحد للإحصائيات — تُستخدم في قوائم المشروع.
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";

export function StatCard({ title, value }: { title: string; value: number | string }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold" dir="ltr">
          {value}
        </p>
      </CardContent>
    </Card>
  );
}

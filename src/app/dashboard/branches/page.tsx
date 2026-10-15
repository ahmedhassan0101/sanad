// صفحة الفروع لمدير المركز: قائمة بعد المحتويات + إضافة/تعديل/أرشفة.
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { viewer } from "@/services/viewer";
import { listBranchesWithCounts } from "@/services/branches";
import { archiveBranchAction, createBranchAction, renameBranchAction } from "./actions";

export default async function BranchesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  const sp = await searchParams;
  const branches = await listBranchesWithCounts(ctx).catch(() => null);
  if (!branches) redirect("/dashboard");
  return (
    <PageContainer>
    <div className="flex flex-col gap-4">
      <PageHeader title="الفروع" description="فروع المركز وإدارة الأسماء والأرشفة" />
      {sp.error && (
        <p className="text-sm text-destructive">{sp.error === "1" ? "تعذر تنفيذ العملية" : sp.error}</p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>فرع جديد</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createBranchAction} className="flex gap-2">
            <Input name="name" required minLength={2} maxLength={60} placeholder="اسم الفرع" className="flex-1" />
            <Button type="submit">إضافة</Button>
          </form>
        </CardContent>
      </Card>
      {branches.map((b) => (
        <Card key={b.id}>
          <CardHeader>
            <CardTitle>
              {b.name}{" "}
              <StatusBadge tone={b.status === "active" ? "success" : "neutral"}>
                {b.status === "active" ? "نشط" : "مؤرشف"}
              </StatusBadge>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <p className="text-sm text-muted-foreground">
              {b.students} طالب — {b.teachers} معلم — {b.members} عضو
            </p>
            {b.status === "active" && (
              <div className="flex flex-col gap-2">
                <form action={renameBranchAction.bind(null, b.id)} className="flex gap-2">
                  <Input name="name" required minLength={2} maxLength={60} defaultValue={b.name} className="flex-1" />
                  <Button type="submit" variant="outline" size="sm">
                    تعديل الاسم
                  </Button>
                </form>
                <form action={archiveBranchAction.bind(null, b.id)}>
                  <Button type="submit" variant="outline" size="sm">
                    أرشفة
                  </Button>
                </form>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
    </PageContainer>
  );
}

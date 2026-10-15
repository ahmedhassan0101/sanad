// الإضافة الجماعية: جدول سريع أو استيراد Excel — تبويبان برابط.
// Server Component — الصلاحية والفروع من السيرفر.
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { cn } from "@/lib/utils";
import { can } from "@/lib/permissions/roles";
import { listBranches } from "@/services/branches-read";
import { viewer } from "@/services/viewer";
import { BulkTable } from "./_bulk-table";
import { ImportTab } from "./_import-tab";

export default async function BulkPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "student:import")) redirect("/dashboard/students");
  const sp = await searchParams;
  const tab = sp.tab === "excel" ? "excel" : "table";
  const branches = await listBranches(ctx);
  const tabCls = (active: boolean) =>
    cn(buttonVariants({ variant: active ? "default" : "ghost" }), "flex-1");
  return (
    <PageContainer>
    <div className="flex flex-col gap-4">
      <PageHeader title="إضافة جماعية" description="جدول سريع أو ملف Excel — بلا تغيير في البيانات الحالية" />
      <div className="flex gap-2">
        <Link href="/dashboard/students/bulk?tab=table" className={tabCls(tab === "table")}>
          جدول سريع
        </Link>
        <Link href="/dashboard/students/bulk?tab=excel" className={tabCls(tab === "excel")}>
          استيراد Excel
        </Link>
      </div>
      {tab === "table" ? (
        <Card>
          <CardHeader>
            <CardTitle>جدول سريع (حتى 200 صف)</CardTitle>
          </CardHeader>
          <CardContent>
            <BulkTable
              branches={branches.map((b) => ({ id: String(b._id), name: b.name }))}
              showBranch={branches.length > 1}
            />
          </CardContent>
        </Card>
      ) : (
        <ImportTab
          branches={branches.map((b) => ({ id: String(b._id), name: b.name }))}
          showBranch={branches.length > 1}
        />
      )}
      <Link href="/dashboard/students" className={buttonVariants({ variant: "ghost" })}>
        رجوع للقائمة
      </Link>
    </div>
    </PageContainer>
  );
}

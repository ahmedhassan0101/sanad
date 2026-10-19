// صفحة إنشاء مجموعة جديدة — النشاط يُحمله من الرابط إن كان صالحًا، وقابل للتغيير.
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { listBranches } from "@/services/branches-read";
import { listTeachers } from "@/services/teachers";
import { viewer } from "@/services/viewer";
import { can } from "@/lib/permissions/roles";
import { ACTIVITIES_CATALOG } from "@/lib/programs";
import { CreateGroupForm } from "../_create-group-form";

const ALL = "all";

function validActivity(value: string | undefined): string {
  const keys = [ALL, ...ACTIVITIES_CATALOG.map((a) => a.key)];
  return value !== undefined && keys.includes(value) ? value : ALL;
}

export default async function NewGroupPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "group:create")) redirect("/dashboard");

  const sp = await searchParams;
  const activity = validActivity(sp.activity);
  const branches = await listBranches(ctx);
  const showBranch = branches.length > 1;
  const teachers = await listTeachers(ctx, { status: "active" });

  const activityLabel = ACTIVITIES_CATALOG.find((a) => a.key === activity)?.name ?? activity;

  return (
    <PageContainer narrow>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="إضافة مجموعة"
          description={`ينتمي لنشاط ${activityLabel}`}
          actions={
            <Link href="/dashboard/groups" className={buttonVariants({ variant: "ghost" })}>
              رجوع للقائمة
            </Link>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>بيانات المجموعة</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateGroupForm
              activity={activity}
              branches={branches.map((b) => ({ id: String(b._id), name: b.name }))}
              showBranch={showBranch}
              teachers={teachers.items.map((t) => ({ id: String(t._id), name: t.name }))}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

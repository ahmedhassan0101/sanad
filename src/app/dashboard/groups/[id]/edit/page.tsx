// صفحة تعديل مجموعة — نفس الفورم مع defaultValues (النشاط والفرع للقراءة فقط، لا حقل الطلاب).
import Link from "next/link";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { getGroup } from "@/services/groups";
import { updateGroupAction } from "@/app/dashboard/groups/actions";
import { viewer } from "@/services/viewer";
import { can } from "@/lib/permissions/roles";
import { CreateGroupForm } from "@/app/dashboard/groups/_create-group-form";

export default async function EditGroupPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "group:edit")) redirect("/dashboard");
  const { id } = await params;
  const group = await getGroup(ctx, id).catch(() => null);
  if (!group) notFound();

  return (
    <PageContainer narrow>
      <div className="flex flex-col gap-4">
        <PageHeader
          title={`تعديل: ${group.name}`}
          description={`نشاط: ${group.activityName}`}
          actions={
            <Link href={`/dashboard/groups/${id}`} className={buttonVariants({ variant: "ghost" })}>
              رجوع للتفاصيل
            </Link>
          }
        />
        <Card>
          <CardHeader>
            <CardTitle>بيانات المجموعة</CardTitle>
          </CardHeader>
          <CardContent>
            <CreateGroupForm
              activity={group.activityKey}
              branches={[{ id: String(group.branchId), name: group.name }]}
              showBranch={false}
              teachers={[]}
              isEdit
              onSubmit={async (values: {
                activityKey: string;
                name: string;
                scheduleText: string;
                teacherId: string;
                notes: string;
              }) => {
                const res = await updateGroupAction(id, {
                  activityKey: values.activityKey,
                  name: values.name,
                  scheduleText: values.scheduleText,
                  teacherId: values.teacherId,
                  notes: values.notes,
                });
                if (!res.ok) {
                  return { ok: false, message: res.message ?? "فشل التعديل" };
                }
                return { ok: true, message: "تم الحفظ" };
              }}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

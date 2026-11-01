// صفحة إضافة معلم جديد.
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { isCloudinaryEnabled } from "@/lib/cloudinary";
import { can } from "@/lib/permissions/roles";
import { listBranches } from "@/services/branches-read";
import { viewer } from "@/services/viewer";
import { TeacherForm } from "../_teacher-form";
import { createTeacherAction } from "../actions";

export default async function NewTeacherPage() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "teacher:create")) redirect("/dashboard/teachers");
  const branches = await listBranches(ctx);
  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader title="إضافة معلم" />
        <Card>
          <CardHeader>
            <CardTitle>بيانات المعلم</CardTitle>
          </CardHeader>
          <CardContent>
            <TeacherForm
              defaultValues={{}}
              branches={branches.map((b) => ({
                id: String(b._id),
                name: b.name,
              }))}
              showBranch={branches.length > 1}
              submitLabel="إضافة المعلم"
              imageEnabled={isCloudinaryEnabled()}
              submitAction={createTeacherAction}
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

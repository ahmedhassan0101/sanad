// صفحة إضافة طالب جديد.
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { isCloudinaryEnabled } from "@/lib/cloudinary";
import { can } from "@/lib/permissions/roles";
import { listBranches } from "@/services/branches-read";
import { viewer } from "@/services/viewer";
import { StudentForm } from "../_student-form";
import { createStudentAction } from "../actions";

export default async function NewStudentPage() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "student:create")) redirect("/dashboard/students");
  const branches = await listBranches(ctx);
  return (
    <PageContainer narrow>
    <div className="flex flex-col gap-4">
      <PageHeader title="إضافة طالب" />
      <Card>
        <CardHeader>
          <CardTitle>بيانات الطالب</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm
            defaultValues={{}}
            branches={branches.map((b) => ({ id: String(b._id), name: b.name }))}
            showBranch={branches.length > 1}
            hifzMode="create"
            submitLabel="إضافة الطالب"
            imageEnabled={isCloudinaryEnabled()}
            submit={createStudentAction}
          />
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  );
}

// صفحة تعديل معلم — نفس الفورم بقيم السجل.
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { isCloudinaryEnabled } from "@/lib/cloudinary";
import { can } from "@/lib/permissions/roles";
import { listBranches } from "@/services/branches-read";
import { getTeacher } from "@/services/teachers";
import { viewer } from "@/services/viewer";
import { TeacherForm } from "../../_teacher-form";
import { updateTeacherAction } from "../../actions";

export default async function EditTeacherPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "teacher:edit")) redirect("/dashboard/teachers");
  const { id } = await params;
  const [teacher, branches] = await Promise.all([
    getTeacher(ctx, id).catch(() => null),
    listBranches(ctx),
  ]);
  if (!teacher) notFound();
  return (
    <PageContainer narrow>
    <div className="flex flex-col gap-4">
      <PageHeader title={`تعديل: ${teacher.name}`} />
      <Card>
        <CardHeader>
          <CardTitle>بيانات المعلم</CardTitle>
        </CardHeader>
        <CardContent>
          <TeacherForm
            defaultValues={{
              name: teacher.name,
              phone: teacher.phone ?? undefined,
              notes: teacher.notes ?? undefined,
              image: teacher.image ?? undefined,
            }}
            branches={branches.map((b) => ({ id: String(b._id), name: b.name }))}
            showBranch={false}
            submitLabel="حفظ التعديلات"
            imageEnabled={isCloudinaryEnabled()}
            submit={(values) => updateTeacherAction(id, values)}
          />
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  );
}

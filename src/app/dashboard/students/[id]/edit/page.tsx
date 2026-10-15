// صفحة تعديل طالب — نفس الفورم بقيم السجل.
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { can } from "@/lib/permissions/roles";
import { isCloudinaryEnabled } from "@/lib/cloudinary";
import { listBranches } from "@/services/branches-read";
import { getStudent } from "@/services/students";
import { viewer } from "@/services/viewer";
import { GUARDIAN_RELATIONS, type OptionKey } from "@/constants/students";
import { StudentForm } from "../../_student-form";
import { updateStudentAction } from "../../actions";

function toDateInput(d: unknown): string | undefined {
  if (!d) return undefined;
  const dt = new Date(d as string);
  if (Number.isNaN(dt.getTime())) return undefined;
  return dt.toISOString().slice(0, 10);
}

export default async function EditStudentPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "student:edit")) redirect("/dashboard/students");
  const { id } = await params;
  const [student, branches] = await Promise.all([
    getStudent(ctx, id).catch(() => null),
    listBranches(ctx),
  ]);
  if (!student) notFound();
  return (
    <PageContainer narrow>
    <div className="flex flex-col gap-4">
      <PageHeader title={`تعديل: ${student.name}`} />
      <Card>
        <CardHeader>
          <CardTitle>بيانات الطالب</CardTitle>
        </CardHeader>
        <CardContent>
          <StudentForm
            defaultValues={{
              name: student.name,
              gender: student.gender as "male" | "female",
              level: student.level as "beginner" | "intermediate" | "advanced",
              birthDate: toDateInput(student.birthDate),
              phone: student.phone ?? undefined,
              address: student.address ?? undefined,
              notes: student.notes ?? undefined,
              guardians: student.guardians.map((g) => ({
                relation: g.relation as OptionKey<typeof GUARDIAN_RELATIONS>,
                phone: g.phone,
              })),
              image: student.image ?? undefined,
              hifzPosition: student.hifzPosition
                ? { surah: student.hifzPosition.surah, ayah: student.hifzPosition.ayah }
                : undefined,
            }}
            branches={branches.map((b) => ({ id: String(b._id), name: b.name }))}
            showBranch={false}
            hifzMode="edit"
            submitLabel="حفظ التعديلات"
            imageEnabled={isCloudinaryEnabled()}
            submit={(values) => updateStudentAction(id, values)}
          />
        </CardContent>
      </Card>
    </div>
    </PageContainer>
  );
}

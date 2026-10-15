// صفحة تقرير جديد — موضع الحفظ معبأ بالموضع الحالي للطالب.
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/permissions/roles";
import { getStudent } from "@/services/students";
import { viewer } from "@/services/viewer";
import { ReportForm } from "../_report-form";
import { createReportAction } from "../actions";

export default async function NewReportPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "report:create")) redirect("/dashboard/students");
  const { id } = await params;
  const student = await getStudent(ctx, id).catch(() => null);
  if (!student || student.status !== "active") notFound();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">تقرير جديد: {student.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>بيانات التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportForm
            studentId={id}
            defaultValues={
              student.hifzPosition
                ? { hifzPosition: { surah: student.hifzPosition.surah, ayah: student.hifzPosition.ayah } }
                : {}
            }
            submitLabel="حفظ التقرير"
            submit={createReportAction.bind(null, id)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

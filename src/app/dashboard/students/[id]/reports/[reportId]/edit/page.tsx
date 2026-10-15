// صفحة تعديل تقرير — نفس الفورم بقيم التقرير.
import { notFound, redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { can } from "@/lib/permissions/roles";
import { getReport } from "@/services/progress-reports";
import { getStudent } from "@/services/students";
import { viewer } from "@/services/viewer";
import { ReportForm } from "../../_report-form";
import { updateReportAction } from "../../actions";

export default async function EditReportPage({
  params,
}: {
  params: Promise<{ id: string; reportId: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "report:edit")) redirect("/dashboard/students");
  const { id, reportId } = await params;
  const student = await getStudent(ctx, id).catch(() => null);
  if (!student) notFound();
  const report = await getReport(ctx, reportId).catch(() => null);
  if (!report || String(report.studentId) !== id) notFound();
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">تعديل تقرير: {student.name}</h1>
      <Card>
        <CardHeader>
          <CardTitle>بيانات التقرير</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportForm
            studentId={id}
            defaultValues={{
              hifzPosition: { surah: report.hifzPosition.surah, ayah: report.hifzPosition.ayah },
              revisionPosition: report.revisionPosition
                ? { surah: report.revisionPosition.surah, ayah: report.revisionPosition.ayah }
                : undefined,
              tajweedRating: report.tajweedRating as "excellent" | "very_good" | "good" | "needs_practice",
              trend: report.trend as "up" | "stable" | "down",
              notes: report.notes ?? undefined,
            }}
            submitLabel="حفظ التعديلات"
            submit={updateReportAction.bind(null, id, reportId)}
          />
        </CardContent>
      </Card>
    </div>
  );
}

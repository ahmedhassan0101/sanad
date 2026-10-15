// أكشنات التقارير: إنشاء/تعديل/حذف — تحويل لصفحة الطالب مع رسالة نجاح.
"use server";

import { redirect } from "next/navigation";
import { createReport, deleteReport, updateReport } from "@/services/progress-reports";
import { viewer } from "@/services/viewer";
import { createReportSchema, updateReportSchema } from "@/validators/reports";

export type ReportActionResult = { ok: boolean; message: string };

async function memberCtx() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  return ctx;
}

export async function createReportAction(
  studentId: string,
  values: unknown,
): Promise<ReportActionResult> {
  const ctx = await memberCtx();
  const parsed = createReportSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    await createReport(ctx, studentId, parsed.data);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر الحفظ" };
  }
  return { ok: true, message: "تم حفظ التقرير" };
}

export async function updateReportAction(
  studentId: string,
  reportId: string,
  values: unknown,
): Promise<ReportActionResult> {
  const ctx = await memberCtx();
  const parsed = updateReportSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    await updateReport(ctx, reportId, parsed.data);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر الحفظ" };
  }
  return { ok: true, message: "تم حفظ التقرير" };
}

export async function deleteReportAction(studentId: string, reportId: string): Promise<void> {
  const ctx = await memberCtx();
  try {
    await deleteReport(ctx, reportId);
  } catch {
    redirect(`/dashboard/students/${studentId}?error=1`);
  }
  redirect(`/dashboard/students/${studentId}`);
}

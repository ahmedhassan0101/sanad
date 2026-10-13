// بطاقة الطالب: معلومات + حفظ + كود ولي الأمر + إجراءات.
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { TrendingDown, TrendingUp, Minus } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GENDERS,
  GUARDIAN_RELATIONS,
  LEVELS,
  PROGRESS_TRENDS,
  STUDENT_STATUS,
  TAJWEED_RATINGS,
  getSurah,
} from "@/constants/students";
import { can } from "@/lib/permissions/roles";
import { ayahsBetween, formatRange } from "@/lib/progress";
import { calcAge, isProfileIncomplete } from "@/lib/students";
import { listReports } from "@/services/progress-reports";
import { getStudent } from "@/services/students";
import { viewer } from "@/services/viewer";
import { archiveStudentAction, restoreStudentAction } from "../actions";
import { CopyTextButton, DeleteStudentButton, RegenerateCodeButton } from "./_actions-ui";
import { DeleteReportButton } from "./reports/_delete-button";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end">{children}</span>
    </div>
  );
}

export default async function StudentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ rpage?: string; saved?: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  const { id } = await params;
  const sp = await searchParams;
  const student = await getStudent(ctx, id).catch(() => null);
  if (!student) notFound();
  const canEdit = can(ctx.role, "student:edit");
  const canArchive = can(ctx.role, "student:archive");
  const canDelete = can(ctx.role, "student:delete") && student.status === "archived";
  const canReport = can(ctx.role, "report:create");
  const canDeleteReport = can(ctx.role, "report:delete");
  const start = student.hifzStart ? getSurah(student.hifzStart.surah) : undefined;
  const pos = student.hifzPosition ? getSurah(student.hifzPosition.surah) : undefined;
  const startText = start && student.hifzStart ? `${start.name} (${student.hifzStart.ayah})` : "—";
  const posText = pos && student.hifzPosition ? `${pos.name} (${student.hifzPosition.ayah})` : "—";
  const rpage = Math.max(1, Number(sp.rpage) || 1);
  const { items: reports, total: reportTotal } = await listReports(ctx, id, { page: rpage, pageSize: 10 });
  const reportPages = Math.max(1, Math.ceil(reportTotal / 10));
  const latest = reports[0];
  const TrendIcon = latest?.trend === "up" ? TrendingUp : latest?.trend === "down" ? TrendingDown : Minus;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {student.image?.url ? (
          <img src={student.image.url} alt={student.name} className="size-12 rounded-full object-cover" />
        ) : (
          <span className="flex size-12 items-center justify-center rounded-full bg-muted text-xl font-bold">
            {student.name.trim().charAt(0)}
          </span>
        )}
        <div>
          <h1 className="text-xl font-bold">{student.name}</h1>
          <p className="text-sm text-muted-foreground">
            {LEVELS.labelOf(student.level)} — {STUDENT_STATUS.labelOf(student.status)}
          </p>
        </div>
      </div>
      {isProfileIncomplete(student) && (
        <p role="alert" className="rounded-md bg-warning-muted p-2 text-sm text-warning-muted-foreground">
          بيانات غير مكتملة: أضف ولي أمر برقم هاتف وتاريخ الميلاد
        </p>
      )}
      <Card>
        <CardHeader>
          <CardTitle>المعلومات</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="النوع">{GENDERS.labelOf(student.gender)}</Row>
          <Row label="العمر">{calcAge(student.birthDate) ?? "—"}</Row>
          <Row label="تاريخ الميلاد">
            {student.birthDate ? new Date(student.birthDate).toISOString().slice(0, 10) : "—"}
          </Row>
          <Row label="هاتف الطالب">{student.phone ?? "—"}</Row>
          <Row label="العنوان">{student.address ?? "—"}</Row>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>أولياء الأمور</CardTitle>
        </CardHeader>
        <CardContent>
          {student.guardians.length === 0 && (
            <p className="text-sm text-muted-foreground">لا أولياء مسجلين</p>
          )}
          {student.guardians.map((g, i) => (
            <Row key={i} label={GUARDIAN_RELATIONS.labelOf(g.relation)}>
              <span className="flex items-center gap-2">
                <a href={`tel:${g.phone}`} dir="ltr" className="underline underline-offset-4">
                  {g.phone}
                </a>
                <CopyTextButton text={g.phone} label="نسخ" />
              </span>
            </Row>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>الحفظ</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="البداية">{startText}</Row>
          <Row label="الحالي">{posText}</Row>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>كود ولي الأمر</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-2">
          <code dir="ltr" className="rounded bg-muted px-2 py-1 font-bold">
            {student.parentCode}
          </code>
          <CopyTextButton text={student.parentCode} label="نسخ" />
          {canEdit && <RegenerateCodeButton id={id} />}
        </CardContent>
      </Card>
      {student.notes && (
        <Card>
          <CardHeader>
            <CardTitle>الملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{student.notes}</p>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>الأنشطة</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">تظهر هنا بعد إضافة المجموعات.</p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>التقارير</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {sp.saved && (
            <p role="status" className="rounded-md bg-success-muted p-2 text-sm text-success-muted-foreground">
              تم حفظ التقرير
            </p>
          )}
          {reports.length === 0 ? (
            <div className="flex flex-col items-start gap-2">
              <p className="text-sm text-muted-foreground">لا تقارير بعد لهذا الطالب.</p>
              {canReport && (
                <Link href={`/dashboard/students/${id}/reports/new`} className={buttonVariants()}>
                  إضافة أول تقرير
                </Link>
              )}
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span>
                  الموضع الحالي: <strong>{posText}</strong>
                </span>
                <span className="text-muted-foreground">آخر تقرير: {latest!.reportDateKey}</span>
                {latest!.ayahs !== null && (
                  <span className="flex items-center gap-1">
                    <TrendIcon className="size-4" />
                    آخر إنجاز: {latest!.ayahs} آية
                  </span>
                )}
              </div>
              {reports.map((r) => {
                const rev = r.revisionPosition;
                const revDiff = rev && r.previous ? ayahsBetween(r.previous, rev) : null;
                return (
                  <div key={r.id} className="flex flex-col gap-1 rounded-lg border p-3 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <strong>{r.reportDateKey}</strong>
                      <span className="flex gap-2">
                        {canReport && (
                          <Link
                            href={`/dashboard/students/${id}/reports/${r.id}/edit`}
                            className="underline underline-offset-4"
                          >
                            تعديل
                          </Link>
                        )}
                        {canDeleteReport && <DeleteReportButton studentId={id} reportId={r.id} />}
                      </span>
                    </div>
                    {r.previous ? (
                      <p>{formatRange(r.previous, r.hifzPosition) ?? "—"}</p>
                    ) : (
                      <span className="w-fit rounded-full bg-muted px-2 py-0.5 text-xs">تقرير أول</span>
                    )}
                    <p>
                      التجويد:{" "}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {TAJWEED_RATINGS.labelOf(r.tajweedRating)}
                      </span>{" "}
                      <span className="text-muted-foreground">{PROGRESS_TRENDS.labelOf(r.trend)}</span>
                    </p>
                    {rev && (
                      <p className="text-muted-foreground">
                        مراجعة: سورة {getSurah(rev.surah)?.name} آية {rev.ayah}
                        {revDiff !== null ? ` (الفرق عن السابق: ${revDiff} آية)` : ""}
                      </p>
                    )}
                    {r.notes && (
                      <details>
                        <summary className="cursor-pointer text-muted-foreground">الملاحظات</summary>
                        <p className="pt-1">{r.notes}</p>
                      </details>
                    )}
                  </div>
                );
              })}
              <div className="flex items-center justify-center gap-4 text-sm">
                {rpage > 1 ? (
                  <Link href={`/dashboard/students/${id}?rpage=${rpage - 1}`}>السابق</Link>
                ) : (
                  <span className="text-muted-foreground">السابق</span>
                )}
                <span>
                  {rpage} / {reportPages}
                </span>
                {rpage < reportPages ? (
                  <Link href={`/dashboard/students/${id}?rpage=${rpage + 1}`}>التالي</Link>
                ) : (
                  <span className="text-muted-foreground">التالي</span>
                )}
              </div>
              {canReport && (
                <Link href={`/dashboard/students/${id}/reports/new`} className={buttonVariants({ variant: "outline" })}>
                  إضافة تقرير
                </Link>
              )}
            </>
          )}
        </CardContent>
      </Card>
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Link href={`/dashboard/students/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
            تعديل
          </Link>
        )}
        {canArchive && (
          <form action={student.status === "active" ? archiveStudentAction.bind(null, id) : restoreStudentAction.bind(null, id)}>
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              {student.status === "active" ? "أرشفة" : "استرجاع"}
            </button>
          </form>
        )}
        {canDelete && <DeleteStudentButton id={id} name={student.name} />}
      </div>
    </div>
  );
}

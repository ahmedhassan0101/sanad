// بطاقة الطالب: معلومات + حفظ + كود ولي الأمر + إجراءات.
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  GENDERS,
  GUARDIAN_RELATIONS,
  LEVELS,
  STUDENT_STATUS,
  getSurah,
} from "@/constants/students";
import { can } from "@/lib/permissions/roles";
import { calcAge, isProfileIncomplete } from "@/lib/students";
import { getStudent } from "@/services/students";
import { viewer } from "@/services/viewer";
import { archiveStudentAction, restoreStudentAction } from "../actions";
import { CopyTextButton, DeleteStudentButton, RegenerateCodeButton } from "./_actions-ui";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end">{children}</span>
    </div>
  );
}

export default async function StudentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  const { id } = await params;
  const student = await getStudent(ctx, id).catch(() => null);
  if (!student) notFound();
  const canEdit = can(ctx.role, "student:edit");
  const canArchive = can(ctx.role, "student:archive");
  const canDelete = can(ctx.role, "student:delete") && student.status === "archived";
  const start = student.hifzStart ? getSurah(student.hifzStart.surah) : undefined;
  const pos = student.hifzPosition ? getSurah(student.hifzPosition.surah) : undefined;
  const startText = start && student.hifzStart ? `${start.name} (${student.hifzStart.ayah})` : "—";
  const posText = pos && student.hifzPosition ? `${pos.name} (${student.hifzPosition.ayah})` : "—";

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
        <CardContent>
          <p className="text-sm text-muted-foreground">قريبًا.</p>
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

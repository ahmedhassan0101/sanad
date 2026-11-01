// بطاقة المعلم: معلومات + هاتف + إجراءات.
import type { ReactNode } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/brand";
import { PageContainer } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { can } from "@/lib/permissions/roles";
import { getTeacher } from "@/services/teachers";
import { viewer } from "@/services/viewer";
import { CopyTextButton } from "../../students/[id]/_actions-ui";
import { archiveTeacherAction, restoreTeacherAction } from "../actions";
import { DeleteTeacherButton } from "./_actions-ui";
import { getTeacherGroups } from "@/services/teachers";
import { STATUS } from "@/constants";

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b py-2 text-sm last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-end">{children}</span>
    </div>
  );
}

export default async function TeacherDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  const { id } = await params;
  const teacher = await getTeacher(ctx, id).catch(() => null);
  if (!teacher) notFound();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const teacherGroups = await getTeacherGroups(ctx, id);
  const canEdit = can(ctx.role, "teacher:edit");
  const canArchive = can(ctx.role, "teacher:archive");
  const canDelete = can(ctx.role, "teacher:delete") && teacher.status === "archived";

  return (
    <PageContainer narrow>
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {teacher.image?.url ? (
          <img src={teacher.image.url} alt={teacher.name} className="size-14 rounded-full object-cover" />
        ) : (
          <Avatar name={teacher.name} className="size-14 text-2xl" />
        )}
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="truncate text-heading-xl font-extrabold">{teacher.name}</h1>
          <span>
            <StatusBadge tone={teacher.status === "active" ? "success" : "neutral"}>
              {STATUS.labelOf(teacher.status)}
            </StatusBadge>
          </span>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>المعلومات</CardTitle>
        </CardHeader>
        <CardContent>
          <Row label="الهاتف">
            {teacher.phone ? (
              <span className="flex items-center gap-2">
                <a href={`tel:${teacher.phone}`} dir="ltr" className="underline underline-offset-4">
                  {teacher.phone}
                </a>
                <CopyTextButton text={teacher.phone} label="نسخ" />
              </span>
            ) : (
              "—"
            )}
          </Row>
        </CardContent>
      </Card>
      {teacher.notes && (
        <Card>
          <CardHeader>
            <CardTitle>الملاحظات</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{teacher.notes}</p>
          </CardContent>
        </Card>
      )}
      <div className="flex flex-wrap gap-2">
        {canEdit && (
          <Link href={`/dashboard/teachers/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
            تعديل
          </Link>
        )}
        {canArchive && (
          <form action={teacher.status === "active" ? archiveTeacherAction.bind(null, id) : restoreTeacherAction.bind(null, id)}>
            <button type="submit" className={buttonVariants({ variant: "outline" })}>
              {teacher.status === "active" ? "أرشفة" : "استرجاع"}
            </button>
          </form>
        )}
        {canDelete && <DeleteTeacherButton id={id} name={teacher.name} />}
      </div>
    </div>
    </PageContainer>
  );
}

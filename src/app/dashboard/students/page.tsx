// قائمة الطلاب: إحصائيات + فلاتر + جدول + ترقيم — Server Component.
import Link from "next/link";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { GraduationCap } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, IconChip } from "@/components/brand";
import { DataCell, DataRow, DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import {
  GENDERS,
  LEVELS,
  STUDENT_STATUS,
  getSurah,
} from "@/constants/students";
import { can } from "@/lib/permissions/roles";
import { daysAgoLabel } from "@/lib/progress";
import { calcAge, isProfileIncomplete } from "@/lib/students";
import { getLatestReportKeys } from "@/services/progress-reports";
import { getStudentStats, listStudents } from "@/services/students";
import { viewer } from "@/services/viewer";
import { StudentsToolbar } from "./_toolbar";
import { archiveStudentAction, restoreStudentAction } from "./actions";

function pageHref(
  sp: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) params.set(k, v);
  params.set("page", String(page));
  return `/dashboard/students?${params.toString()}`;
}

export default async function StudentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "student:report")) redirect("/dashboard");
  const sp = await searchParams;
  const validOrUndefined = (v: string | undefined, keys: readonly string[]) =>
    v && (keys as readonly string[]).includes(v) ? v : undefined;
  const query = {
    q: sp.q ?? "",
    level: validOrUndefined(sp.level, LEVELS.keys),
    gender: validOrUndefined(sp.gender, GENDERS.keys),
    status: validOrUndefined(sp.status, STUDENT_STATUS.keys) ?? "active",
    incomplete: sp.incomplete === "true",
    page: Math.max(1, Number(sp.page) || 1),
    pageSize: 20,
  };
  const [stats, { items, total, page, pageSize }] = await Promise.all([
    getStudentStats(ctx),
    listStudents(ctx, query),
  ]);
  const latestKeys = await getLatestReportKeys(
    ctx,
    items.map((s) => s._id),
  );
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canEdit = can(ctx.role, "student:edit");
  const canArchive = can(ctx.role, "student:archive");
  const canCreate = can(ctx.role, "student:create");

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="الطلاب"
          description={total > 0 ? `${total} طالب` : undefined}
          actions={
            <>
              {can(ctx.role, "student:import") && (
                <Link href="/dashboard/students/bulk" className={buttonVariants({ variant: "secondary" })}>
                  إضافة جماعية
                </Link>
              )}
              {canCreate && (
                <Link href="/dashboard/students/new" className={buttonVariants()}>
                  إضافة طالب
                </Link>
              )}
            </>
          }
        />
      {sp.error && (
        <p role="alert" className="text-sm text-destructive">
          تعذر تنفيذ العملية — تحقق من الصلاحيات
        </p>
      )}
      <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
        <StatCard title="النشطون" value={stats.active} />
        <StatCard title="بيانات ناقصة" value={stats.incomplete} />
        <StatCard title="إضافات هذا الشهر" value={stats.addedThisMonth} />
        <StatCard title="المؤرشفون" value={stats.archived} />
      </div>
      <DataTable
        density="compact"
        toolbar={
          <Card>
            <CardContent className="pt-4">
              <NuqsAdapter>
                <StudentsToolbar />
              </NuqsAdapter>
            </CardContent>
          </Card>
        }
        headers={["الاسم", "المستوى", "النوع", "العمر", "هاتف ولي الأمر", "موضع الحفظ", "آخر تقرير", "إجراءات"]}
        empty={
          items.length === 0 ? (
            <EmptyState
              icon={
                <IconChip tone="info">
                  <GraduationCap className="size-5" />
                </IconChip>
              }
              title={query.q ? "لا نتائج مطابقة" : "لا طلاب بعد"}
              description={query.q ? "جرّب تغيير البحث أو الفلاتر" : "أضف أول طالب لبدء سجل المركز"}
              action={
                canCreate && !query.q ? (
                  <Link href="/dashboard/students/new" className={buttonVariants({ size: "sm" })}>
                    إضافة طالب
                  </Link>
                ) : undefined
              }
            />
          ) : undefined
        }
      >
        {items.map((s) => {
          const incomplete = isProfileIncomplete(s);
          const pos = s.hifzPosition;
          const surah = pos ? getSurah(pos.surah) : undefined;
          return (
            <DataRow key={String(s._id)}>
              <DataCell>
                <span className="flex items-center gap-2">
                  {s.image?.url ? (
                    <img src={s.image.url} alt="" className="size-8 rounded-full object-cover" />
                  ) : (
                    <Avatar name={s.name} className="size-8 text-sm" />
                  )}
                  <Link href={`/dashboard/students/${s._id}`} className="font-medium underline-offset-4 hover:underline">
                    {s.name}
                  </Link>
                  {incomplete && <StatusBadge tone="warning">بيانات ناقصة</StatusBadge>}
                </span>
              </DataCell>
              <DataCell>
                <StatusBadge>{LEVELS.labelOf(s.level)}</StatusBadge>
              </DataCell>
              <DataCell>{GENDERS.labelOf(s.gender)}</DataCell>
              <DataCell numeric>{calcAge(s.birthDate) ?? "—"}</DataCell>
              <DataCell numeric>
                <span dir="ltr">{s.guardians[0]?.phone ?? "—"}</span>
              </DataCell>
              <DataCell>{surah ? `${surah.name} (${pos!.ayah})` : "—"}</DataCell>
              <DataCell>
                <span className="text-muted-foreground">
                  {daysAgoLabel(latestKeys.get(String(s._id)) ?? null)}
                </span>
              </DataCell>
              <DataCell>
                <span className="flex gap-2">
                  <Link href={`/dashboard/students/${s._id}`} className="underline underline-offset-4">
                    عرض
                  </Link>
                  {canEdit && (
                    <Link href={`/dashboard/students/${s._id}/edit`} className="underline underline-offset-4">
                      تعديل
                    </Link>
                  )}
                  {canArchive && (
                    <form
                      action={
                        s.status === "active"
                          ? archiveStudentAction.bind(null, String(s._id))
                          : restoreStudentAction.bind(null, String(s._id))
                      }
                    >
                      <button type="submit" className="underline underline-offset-4">
                        {s.status === "active" ? "أرشفة" : "استرجاع"}
                      </button>
                    </form>
                  )}
                </span>
              </DataCell>
            </DataRow>
          );
        })}
      </DataTable>
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link
              href={pageHref(sp, page - 1)}
              className="underline underline-offset-4"
            >
              السابق
            </Link>
          ) : (
            <span className="text-muted-foreground">السابق</span>
          )}
          <span>
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link
              href={pageHref(sp, page + 1)}
              className="underline underline-offset-4"
            >
              التالي
            </Link>
          ) : (
            <span className="text-muted-foreground">التالي</span>
          )}
        </div>
      )}
      </div>
    </PageContainer>
  );
}

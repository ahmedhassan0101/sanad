// قائمة المعلمين: إحصائيات + فلاتر + جدول + ترقيم — Server Component.
import Link from "next/link";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { Presentation } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, IconChip } from "@/components/brand";
import { DataCell, DataRow, DataTable } from "@/components/data-table";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { can } from "@/lib/permissions/roles";
import { getTeacherStats, listTeachers } from "@/services/teachers";
import { viewer } from "@/services/viewer";
import { TeachersToolbar } from "./_toolbar";
import { archiveTeacherAction, restoreTeacherAction } from "./actions";
import { STATUS } from "@/constants";

const validOrUndefined = (v: string | undefined, keys: readonly string[]) =>
  v && (keys as readonly string[]).includes(v) ? v : undefined;

function pageHref(
  sp: Record<string, string | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [k, v] of Object.entries(sp)) if (v) params.set(k, v);
  params.set("page", String(page));
  return `/dashboard/teachers?${params.toString()}`;
}

export default async function TeachersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "teacher:create")) redirect("/dashboard");
  const sp = await searchParams; 
  const query = {
    q: sp.q ?? "",
    status: validOrUndefined(sp.status, STATUS.keys) ?? "active",
    page: Math.max(1, Number(sp.page) || 1),
    pageSize: 20,
  };
  const [stats, { items, total, page, pageSize }] = await Promise.all([
    getTeacherStats(ctx),
    listTeachers(ctx, query),
  ]);
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canEdit = can(ctx.role, "teacher:edit");
  const canArchive = can(ctx.role, "teacher:archive");

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="المعلمون"
          description={total > 0 ? `${total} معلم` : undefined}
          actions={
            <Link href="/dashboard/teachers/new" className={buttonVariants()}>
              إضافة معلم
            </Link>
          }
        />
        {sp.error && (
          <p role="alert" className="text-sm text-destructive">
            تعذر تنفيذ العملية — تحقق من الصلاحيات
          </p>
        )}
        <div className="grid grid-cols-2 gap-2 lg:grid-cols-3">
          <StatCard title="النشطون" value={stats.active} />
          <StatCard title="إضافات هذا الشهر" value={stats.addedThisMonth} />
          <StatCard title="المؤرشفون" value={stats.archived} />
        </div>
        <DataTable
          density="compact"
          toolbar={
            <Card>
              <CardContent className="pt-4">
                <NuqsAdapter>
                  <TeachersToolbar />
                </NuqsAdapter>
              </CardContent>
            </Card>
          }
          headers={["الاسم", "الهاتف", "الحالة", "إجراءات"]}
          empty={
            items.length === 0 ? (
              <EmptyState
                icon={
                  <IconChip tone="info">
                    <Presentation className="size-5" />
                  </IconChip>
                }
                title={query.q ? "لا نتائج مطابقة" : "لا معلمين بعد"}
                description={
                  query.q ? "جرّب تغيير البحث" : "أضف أول معلم لبدء فريق المركز"
                }
                action={
                  !query.q ? (
                    <Link
                      href="/dashboard/teachers/new"
                      className={buttonVariants({ size: "sm" })}
                    >
                      إضافة معلم
                    </Link>
                  ) : undefined
                }
              />
            ) : undefined
          }
        >
          {items.map((t) => (
            <DataRow key={String(t._id)}>
              <DataCell>
                <span className="flex items-center gap-2">
                  {t.image?.url ? (
                    <img
                      src={t.image.url}
                      alt=""
                      className="size-8 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar name={t.name} className="size-8 text-sm" />
                  )}
                  <Link
                    href={`/dashboard/teachers/${t._id}`}
                    className="font-medium underline-offset-4 hover:underline"
                  >
                    {t.name}
                  </Link>
                </span>
              </DataCell>
              <DataCell numeric>
                {t.phone ? (
                  <a
                    href={`tel:${t.phone}`}
                    dir="ltr"
                    className="underline underline-offset-4"
                  >
                    {t.phone}
                  </a>
                ) : (
                  "—"
                )}
              </DataCell>
              <DataCell>
                <StatusBadge
                  tone={t.status === "active" ? "success" : "neutral"}
                >
                  {STATUS.labelOf(t.status)}
                </StatusBadge>
              </DataCell>
              <DataCell>
                <span className="flex gap-2">
                  <Link
                    href={`/dashboard/teachers/${t._id}`}
                    className="underline underline-offset-4"
                  >
                    عرض
                  </Link>
                  {canEdit && (
                    <Link
                      href={`/dashboard/teachers/${t._id}/edit`}
                      className="underline underline-offset-4"
                    >
                      تعديل
                    </Link>
                  )}
                  {canArchive && (
                    <form
                      action={
                        t.status === "active"
                          ? archiveTeacherAction.bind(null, String(t._id))
                          : restoreTeacherAction.bind(null, String(t._id))
                      }
                    >
                      <button
                        type="submit"
                        className="underline underline-offset-4"
                      >
                        {t.status === "active" ? "أرشفة" : "استرجاع"}
                      </button>
                    </form>
                  )}
                </span>
              </DataCell>
            </DataRow>
          ))}
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

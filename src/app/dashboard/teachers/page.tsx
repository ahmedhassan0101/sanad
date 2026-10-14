// قائمة المعلمين: إحصائيات + فلاتر + جدول + ترقيم — Server Component.
import Link from "next/link";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { TEACHER_STATUS } from "@/constants/teachers";
import { can } from "@/lib/permissions/roles";
import { getTeacherStats, listTeachers } from "@/services/teachers";
import { viewer } from "@/services/viewer";
import { TeachersToolbar } from "./_toolbar";
import { archiveTeacherAction, restoreTeacherAction } from "./actions";

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
    status: validOrUndefined(sp.status, TEACHER_STATUS.keys) ?? "active",
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
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">المعلمون</h1>
        <Link href="/dashboard/teachers/new" className={buttonVariants()}>
          إضافة معلم
        </Link>
      </div>
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
      <Card>
        <CardContent className="pt-4">
          <NuqsAdapter>
            <TeachersToolbar />
          </NuqsAdapter>
        </CardContent>
      </Card>
      {items.length === 0 ? (
        <EmptyState
          title="لا معلمين"
          description="جرّب تغيير الفلاتر أو أضف معلمًا جديدًا"
        />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-180 text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="p-2 text-start">الاسم</th>
                  <th className="p-2 text-start">الهاتف</th>
                  <th className="p-2 text-start">الحالة</th>
                  <th className="p-2 text-start">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((t) => (
                  <tr key={String(t._id)} className="border-b last:border-0">
                    <td className="p-2">
                      <span className="flex items-center gap-2">
                        {t.image?.url ? (
                          <img
                            src={t.image.url}
                            alt=""
                            className="size-8 rounded-full object-cover"
                          />
                        ) : (
                          <span className="flex size-8 items-center justify-center rounded-full bg-muted font-bold">
                            {t.name.trim().charAt(0)}
                          </span>
                        )}
                        {t.name}
                      </span>
                    </td>
                    <td className="p-2" dir="ltr">
                      {t.phone ? (
                        <a
                          href={`tel:${t.phone}`}
                          className="underline underline-offset-4"
                        >
                          {t.phone}
                        </a>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="p-2">
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                        {TEACHER_STATUS.labelOf(t.status)}
                      </span>
                    </td>
                    <td className="p-2">
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
                                ? archiveTeacherAction.bind(
                                    null,
                                    String(t._id),
                                  )
                                : restoreTeacherAction.bind(
                                    null,
                                    String(t._id),
                                  )
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
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
  );
}

// قائمة الطلاب: إحصائيات + فلاتر + جدول + ترقيم — Server Component.
import Link from "next/link";
import { redirect } from "next/navigation";
import { NuqsAdapter } from "nuqs/adapters/next/app";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { StatCard } from "@/components/stat-card";
import { GENDERS, LEVELS, STUDENT_STATUS, getSurah } from "@/constants/students";
import { can } from "@/lib/permissions/roles";
import { calcAge, isProfileIncomplete } from "@/lib/students";
import { getStudentStats, listStudents } from "@/services/students";
import { viewer } from "@/services/viewer";
import { StudentsToolbar } from "./_toolbar";
import { archiveStudentAction, restoreStudentAction } from "./actions";

const validOrUndefined = (v: string | undefined, keys: readonly string[]) =>
  v && (keys as readonly string[]).includes(v) ? v : undefined;

function pageHref(sp: Record<string, string | undefined>, page: number): string {
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
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const canEdit = can(ctx.role, "student:edit");
  const canArchive = can(ctx.role, "student:archive");
  const canCreate = can(ctx.role, "student:create");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">الطلاب</h1>
        {canCreate && (
          <Link href="/dashboard/students/new" className={buttonVariants()}>
            إضافة طالب
          </Link>
        )}
      </div>
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
      <Card>
        <CardContent className="pt-4">
          <NuqsAdapter>
            <StudentsToolbar />
          </NuqsAdapter>
        </CardContent>
      </Card>
      {items.length === 0 ? (
        <EmptyState title="لا طلاب" description="جرّب تغيير الفلاتر أو أضف طالبًا جديدًا" />
      ) : (
        <Card>
          <CardContent className="overflow-x-auto p-0">
            <table className="w-full min-w-[720px] text-sm">
              <thead>
                <tr className="border-b text-muted-foreground">
                  <th className="p-2 text-start">الاسم</th>
                  <th className="p-2 text-start">المستوى</th>
                  <th className="p-2 text-start">النوع</th>
                  <th className="p-2 text-start">العمر</th>
                  <th className="p-2 text-start">هاتف ولي الأمر</th>
                  <th className="p-2 text-start">الأنشطة</th>
                  <th className="p-2 text-start">موضع الحفظ</th>
                  <th className="p-2 text-start">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((s) => {
                  const incomplete = isProfileIncomplete(s);
                  const pos = s.hifzPosition;
                  const surah = pos ? getSurah(pos.surah) : undefined;
                  return (
                    <tr key={String(s._id)} className="border-b last:border-0">
                      <td className="p-2">
                        <span className="flex items-center gap-2">
                          {s.image?.url ? (
                            <img src={s.image.url} alt="" className="size-8 rounded-full object-cover" />
                          ) : (
                            <span className="flex size-8 items-center justify-center rounded-full bg-muted font-bold">
                              {s.name.trim().charAt(0)}
                            </span>
                          )}
                          {s.name}
                          {incomplete && (
                            <span className="rounded-full bg-warning-muted px-2 py-0.5 text-xs text-warning-muted-foreground">
                              بيانات ناقصة
                            </span>
                          )}
                        </span>
                      </td>
                      <td className="p-2">
                        <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
                          {LEVELS.labelOf(s.level)}
                        </span>
                      </td>
                      <td className="p-2">{GENDERS.labelOf(s.gender)}</td>
                      <td className="p-2">{calcAge(s.birthDate) ?? "—"}</td>
                      <td className="p-2" dir="ltr">
                        {s.guardians[0]?.phone ?? "—"}
                      </td>
                      <td className="p-2 text-muted-foreground">—</td>
                      <td className="p-2">{surah ? `${surah.name} (${pos!.ayah})` : "—"}</td>
                      <td className="p-2">
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
                            <form action={s.status === "active" ? archiveStudentAction.bind(null, String(s._id)) : restoreStudentAction.bind(null, String(s._id))}>
                              <button type="submit" className="underline underline-offset-4">
                                {s.status === "active" ? "أرشفة" : "استرجاع"}
                              </button>
                            </form>
                          )}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
      {pages > 1 && (
        <div className="flex items-center justify-center gap-4 text-sm">
          {page > 1 ? (
            <Link href={pageHref(sp, page - 1)} className="underline underline-offset-4">
              السابق
            </Link>
          ) : (
            <span className="text-muted-foreground">السابق</span>
          )}
          <span>
            {page} / {pages}
          </span>
          {page < pages ? (
            <Link href={pageHref(sp, page + 1)} className="underline underline-offset-4">
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

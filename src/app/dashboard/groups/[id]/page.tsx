// صفحة تفاصيل المجموعة — تبويبات الأعضاء والحضور، وإجراءات المجموعة.
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Edit3 } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/brand";
import { PageContainer } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getGroup, archiveGroup, restoreGroup, deleteGroupPermanently } from "@/services/groups";
import { viewer } from "@/services/viewer";
import { can } from "@/lib/permissions/roles";
import type { SessionContext } from "@/lib/tenant/context";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

function breadcrumb(activityName: string, groupName: string) {
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground mb-2">
      <Link href="/dashboard/groups" className="underline underline-offset-4 hover:underline">
        المجموعات
      </Link>
      <span>/</span>
      <Link
        href={`/dashboard/groups?activity=${activityName}`}
        className="underline underline-offset-4 hover:underline"
      >
        {activityName}
      </Link>
      <span>/</span>
      <span>{groupName}</span>
    </div>
  );
}

export default async function GroupDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "group:create")) redirect("/dashboard");
  const memberCtx: MemberCtx = ctx as MemberCtx;
  const { id } = await params;
  const sp = await searchParams;
  const tab = sp.tab === "attendance" ? "attendance" : "members";
  const group = await getGroup(memberCtx, id).catch(() => null);
  if (!group) notFound();
  const canEdit = can(memberCtx.role, "group:edit");
  const canArchive = can(memberCtx.role, "group:archive");
  const canDelete = can(memberCtx.role, "group:delete") && group.status === "archived";

  async function handleArchive() {
    await archiveGroup(memberCtx, id);
    window.location.href = `/dashboard/groups/${id}`;
  }

  async function handleRestore() {
    await restoreGroup(memberCtx, id);
    window.location.href = `/dashboard/groups/${id}`;
  }

  async function handleDelete() {
    if (confirm("هل تأكيد حذف المجموعة نهائيًا؟ سيُحذف سجلها أيضًا.")) {
      await deleteGroupPermanently(memberCtx, id);
      window.location.href = "/dashboard/groups";
    }
  }

  return (
    <PageContainer narrow>
      <div className="flex flex-col gap-4">
        {breadcrumb(group.activityName, group.name)}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              {group.teacherId ? (
                <Avatar name={group.teacherName ?? ""} className="size-12 text-2xl" />
              ) : (
                <Avatar name={group.name} className="size-12 text-2xl" />
              )}
              <div className="flex min-w-0 flex-col gap-1">
                <h1 className="truncate text-heading-xl font-extrabold">{group.name}</h1>
                <div className="flex flex-wrap gap-1">
                  <StatusBadge>{group.activityName}</StatusBadge>
                  <StatusBadge tone={group.status === "active" ? "success" : "neutral"}>
                    {group.status === "active" ? "نشطة" : "مؤرشفة"}
                  </StatusBadge>
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {group.scheduleText || "لا وقت محدد"} — {group.memberCount} عضو
                </p>
              </div>
            </div>
            <div className="flex items-end gap-2">
              {canEdit && (
                <Link href={`/dashboard/groups/${id}/edit`} className={buttonVariants({ variant: "outline" })}>
                  <Edit3 className="size-4 mr-2" /> تعديل
                </Link>
              )}
              {group.status === "active" ? (
                canArchive && (
                  <button type="button" className={buttonVariants({ variant: "outline" })} onClick={handleArchive}>
                    أرشفة
                  </button>
                )
              ) : (
                canArchive && (
                  <button type="button" className={buttonVariants({ variant: "outline" })} onClick={handleRestore}>
                    استرجاع
                  </button>
                )
              )}
              {canDelete && (
                <button type="button" className={buttonVariants({ variant: "destructive" })} onClick={handleDelete}>
                  حذف نهائي
                </button>
              )}
            </div>
          </CardHeader>
          {group.notes && (
            <CardContent>
              <p className="text-sm">{group.notes}</p>
            </CardContent>
          )}
        </Card>

        <div className="flex gap-2">
          <Link
            href={`/dashboard/groups/${id}?tab=members`}
            className={buttonVariants(tab === "members" ? { variant: "default" } : { variant: "ghost" })}
          >
            الأعضاء ({group.memberCount})
          </Link>
          <Link
            href={`/dashboard/groups/${id}?tab=attendance`}
            className={buttonVariants(tab === "attendance" ? { variant: "default" } : { variant: "ghost" })}
          >
            الحضور
          </Link>
        </div>

        {tab === "members" && (
          <Card>
            <CardHeader>
              <CardTitle>أعضاء المجموعة</CardTitle>
            </CardHeader>
            <CardContent>
              {group.members.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  لا أعضاء في هذه المجموعة بعد.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm border-collapse">
                    <thead>
                      <tr className="border-b border-border bg-muted/50 text-start text-xs font-medium text-muted-foreground">
                        <th className="px-3 py-3">الاسم</th>
                        <th className="px-3 py-3">المستوى</th>
                        <th className="px-3 py-3">موضع الحفظ</th>
                        <th className="px-3 py-3">آخر تقرير</th>
                        <th className="px-3 py-3 text-right">هاتف ولي الأمر</th>
                        <th className="px-3 py-3 text-right">إجراءات</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.members.map((m) => (
                        <tr key={m.studentId} className="border-b border-border-subtle last:border-0 hover:bg-muted/30">
                          <td className="px-3 py-2.5">
                            <Link href={`/dashboard/students/${m.studentId}`} className="font-medium underline-offset-4 hover:underline">
                              {m.name}
                            </Link>
                          </td>
                          <td className="px-3 py-2.5">
                            <StatusBadge>{m.level}</StatusBadge>
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {m.hifzPosition ? `${m.hifzPosition.surah}:${m.hifzPosition.ayah}` : "—"}
                          </td>
                          <td className="px-3 py-2.5 text-muted-foreground">
                            {m.lastReport ?? "—"}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            {m.guardianPhone ? (
                              <a href={`tel:${m.guardianPhone}`} dir="ltr" className="underline underline-offset-4 text-sm">
                                {m.guardianPhone}
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right">
                            <button
                              type="button"
                              className="text-sm text-destructive underline underline-offset-4 hover:underline"
                              onClick={() => {
                                if (confirm("هل تأكيد إزالة هذا العضو من المجموعة؟")) {
                                  // إزالة العضو — سيتم عبر أكشن منفصل لاحقًا
                                }
                              }}
                            >
                              إزالة
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        )}
        {tab === "attendance" && (
          <Card>
            <CardHeader>
              <CardTitle>الحضور</CardTitle>
            </CardHeader>
            <CardContent className="py-10 text-center">
              <p className="text-sm text-muted-foreground">سجل الحضور قادم قريبًا.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

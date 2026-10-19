// المجموعات: صفحة واحدة لكل الأنشطة — بطاقات بدلاً من جدول.
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen, Clock, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/brand";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { StatusBadge } from "@/components/status-badge";
import { listGroups, getGroupsOverview } from "@/services/groups";
import { viewer } from "@/services/viewer";
import { can } from "@/lib/permissions/roles";
import { ACTIVITIES_CATALOG } from "@/lib/programs";
import type { GroupRow } from "@/services/groups";

const ALL = "all";

function validActivity(value: string | undefined): string {
  const keys = [ALL, ...ACTIVITIES_CATALOG.map((a) => a.key)];
  return value !== undefined && keys.includes(value) ? value : ALL;
}

function tabClass(active: boolean): string {
  return `rounded-md px-3 py-2 text-sm font-medium min-w-[110px] text-center ${
    active ? "bg-accent text-accent-foreground border border-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  }`;
}

function GroupCard({ g }: { g: GroupRow }) {
  return (
    <Card key={g.id} className="hover:bg-muted/30 cursor-pointer transition-colors group" onClick={() => {}}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Link href={`/dashboard/groups/${g.id}`} className="font-semibold underline-offset-4 hover:underline">
            {g.name}
          </Link>
          <StatusBadge>{g.activityName}</StatusBadge>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          {g.teacherName ? (
            <span className="flex items-center gap-1">
              <Avatar name={g.teacherName} className="size-6 text-xs" />
              {g.teacherName}
            </span>
          ) : (
            <span>بدون معلم</span>
          )}
          <span className="hidden md:inline">·</span>
          <Clock className="size-4" />
          <span>{g.scheduleText || "—"}</span>
          <span className="hidden md:inline">·</span>
          <Users className="size-4" />
          <span>{g.memberCount} عضو</span>
        </div>
        <StatusBadge tone={g.status === "active" ? "success" : "neutral"}>
          {g.status === "active" ? "نشطة" : "مؤرشفة"}
        </StatusBadge>
      </CardHeader>
      <CardContent>
        <Link href={`/dashboard/groups/${g.id}`} className="block text-sm text-primary hover:text-primary-foreground">
          عرض التفاصيل →
        </Link>
      </CardContent>
    </Card>
  );
}

export default async function GroupsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  if (!can(ctx.role, "group:create")) redirect("/dashboard");

  const sp = await searchParams;
  const activity = validActivity(sp.activity);
  const q = sp.q ?? "";
  const act = activity === ALL ? undefined : activity;

  const [overview, rows] = await Promise.all([
    getGroupsOverview(ctx, { activityKey: act }),
    listGroups(ctx, { activityKey: act, q }),
  ]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="المجموعات"
          description={
            activity === ALL
              ? "كل مجموعات المركز"
              : `${overview?.activityName ?? activity} — ${overview?.activeGroups} مجموعة`
          }
          actions={
            can(ctx.role, "group:create") && (
              <Link href={`/dashboard/groups/new?activity=${activity}`} className={buttonVariants()}>
                إضافة مجموعة
              </Link>
            )
          }
        />
        <div className="overflow-x-auto border-b border-border pb-2 mb-2">
          <div className="flex items-center gap-1 min-w-[600px]">
            <Link
              href={`/dashboard/groups${q ? "?q=" + q : ""}`}
              className={tabClass(activity === ALL)}
            >
              الكل
            </Link>
            {ACTIVITIES_CATALOG.map((a) => (
              <Link
                key={a.key}
                href={`/dashboard/groups?activity=${a.key}${q ? "&q=" + q : ""}`}
                className={tabClass(activity === a.key)}
              >
                {a.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="المجموعات النشطة" value={overview?.activeGroups ?? 0} />
          <StatCard title="الطلاب المشتركون" value={overview?.studentCount ?? 0} />
        </div>

        {activity === ALL ? (
          <>
            {ACTIVITIES_CATALOG.map((a) => {
              const catRows = rows.filter((r) => r.activityKey === a.key);
              if (catRows.length === 0) return null;
              return (
                <div key={a.key} className="flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-semibold">{a.name}</h2>
                    <span className="text-xs text-muted-foreground">
                      {catRows.length} مجموعة ·
                      {catRows.reduce((sum, r) => sum + r.memberCount, 0)} طالباً
                    </span>
                    {can(ctx.role, "group:create") && (
                      <Link
                        href={`/dashboard/groups/new?activity=${a.key}${q ? "&q=" + q : ""}`}
                        className={buttonVariants({ variant: "outline", size: "sm" })}
                      >
                        + مجموعة
                      </Link>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {catRows.slice(0, 6).map((g) => (
                      <GroupCard key={g.id} g={g} />
                    ))}
                    {catRows.length > 6 && (
                      <div className="col-span-full text-center">
                        <Link href={`/dashboard/groups?activity=${a.key}${q ? "&q=" + q : ""}`} className="text-sm underline underline-offset-4 hover:underline">
                          عرض الكل ({catRows.length}) →
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {rows.map((g) => (
                <GroupCard key={g.id} g={g} />
              ))}
            </div>
            {rows.length === 0 && (
              <EmptyState
                icon={<BookOpen className="size-10 text-muted-foreground" />}
                title="لا مجموعات في هذا النشاط"
                description="جرّب تغيير النشاط أو الفلاتر."
                action={
                  can(ctx.role, "group:create") ? (
                    <Link href="/dashboard/groups/new" className={buttonVariants({ size: "sm" })}>
                      إضافة أول مجموعة
                    </Link>
                  ) : undefined
                }
              />
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}

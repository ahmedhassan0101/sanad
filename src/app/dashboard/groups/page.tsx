// المجموعات: صفحة واحدة لكل البرامج.
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { EmptyState } from "@/components/empty-state";
import { DataCell, DataRow, DataTable } from "@/components/data-table";
import { listGroups, getGroupsOverview } from "@/services/groups";
import { viewer } from "@/services/viewer";
import { can } from "@/lib/permissions/roles";
import { PROGRAM_CATALOG } from "@/lib/programs";
import type { GroupRow } from "@/services/groups";

const ALL = "all";

function validProgram(value: string | undefined): string {
  const keys = [ALL, ...PROGRAM_CATALOG.map((p) => p.key)];
  return value !== undefined && keys.includes(value) ? value : ALL;
}

function tabClass(active: boolean): string {
  return `rounded-md px-3 py-2 text-sm font-medium min-w-[110px] text-center ${
    active ? "bg-accent text-accent-foreground border border-primary" : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
  }`;
}

function GroupTableRow({ g }: { g: GroupRow }) {
  return (
    <DataRow key={g.id}>
      <DataCell>
        <Link href={`/dashboard/groups/${g.id}`} className="font-medium underline-offset-4 hover:underline">
          {g.name}
        </Link>
      </DataCell>
      <DataCell>
        <span>{g.programName}</span>
      </DataCell>
      <DataCell>
        <span>{g.teacherName ?? "—"}</span>
      </DataCell>
      <DataCell numeric>{g.memberCount}</DataCell>
      <DataCell>
        <span>{g.status}</span>
      </DataCell>
      <DataCell>
        <Link href={`/dashboard/groups/${g.id}`} className="underline underline-offset-4 text-xs">
          عرض
        </Link>
      </DataCell>
    </DataRow>
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
  const program = validProgram(sp.program);
  const q = sp.q ?? "";
  const teacher = sp.teacher ?? "";
  const status = sp.status ?? "active";
  const prog = program === ALL ? undefined : program;

  const [overview, rows] = await Promise.all([
    getGroupsOverview(ctx, { programKey: prog }),
    listGroups(ctx, { programKey: prog, q, teacherId: teacher, status }),
  ]);

  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader
          title="المجموعات"
          description={
            program === ALL
              ? "كل مجموعات المركز"
              : `${overview?.programName ?? program} — ${overview?.activeGroups} مجموعة`
          }
          actions={
            can(ctx.role, "group:create") && (
              <Link
                href={`/dashboard/groups/new?program=${program}`}
                className={buttonVariants()}
              >
                إضافة مجموعة
              </Link>
            )
          }
        />
        <div className="overflow-x-auto border-b border-border pb-2 mb-2">
          <div className="flex items-center gap-1 min-w-[600px]">
            <Link
              href={`/dashboard/groups?program=all${q ? "&q=" + q : ""}`}
              className={tabClass(program === ALL)}
            >
              الكل
            </Link>
            {PROGRAM_CATALOG.map((p) => (
              <Link
                key={p.key}
                href={`/dashboard/groups?program=${p.key}${q ? "&q=" + q : ""}`}
                className={tabClass(program === p.key)}
              >
                {p.name}
              </Link>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="المجموعات النشطة" value={overview?.activeGroups ?? 0} />
          <StatCard title="الطلاب المشتركون" value={overview?.studentCount ?? 0} />
        </div>
        {rows.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="size-10 text-muted-foreground" />}
            title={
              program === ALL ? "لا مجموعات بعد" : "لا مجموعات في هذا البرنامج"
            }
            description={
              program === ALL
                ? "ابدأ بإضافة أول مجموعة لمركزك."
                : "جرّب تغيير البرنامج أو الفلاتر."
            }
            action={
              can(ctx.role, "group:create") && program === ALL ? (
                <Link href="/dashboard/groups/new" className={buttonVariants({ size: "sm" })}>
                  إضافة أول مجموعة
                </Link>
              ) : undefined
            }
          />
        ) : (
          <DataTable density="compact" headers={["المgruppe", "البرنامج", "المعلم", "الأعضاء", "الحالة", "إجراءات"]}>
            {rows.map((g) => <GroupTableRow key={g.id} g={g} />)}
          </DataTable>
        ) }
      </div>
    </PageContainer>
  );
}

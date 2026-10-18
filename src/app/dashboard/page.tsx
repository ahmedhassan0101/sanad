// الرئيسية: ترحيب + رقم رئيسي + إحصاءات + اختصارات.
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ClipboardCheck,
  GraduationCap,
  Presentation,
  UserPlus,
} from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { StatusBadge } from "@/components/status-badge";
import { IconChip, PatternTile } from "@/components/brand";
import { getDashboard } from "@/services/screens";
import { readBranchPref } from "@/services/branch-pref";
import { viewer } from "@/services/viewer";
import { ROLE_NAMES_AR as ROLE_NAMES } from "@/constants/students";

const QUICK = [
  { href: "/dashboard/students/new", label: "طالب جديد", icon: GraduationCap },
  { href: "/dashboard/teachers/new", label: "معلم جديد", icon: Presentation },
  { href: "/dashboard/attendance", label: "تسجيل الحضور", icon: ClipboardCheck },
  { href: "/dashboard/team", label: "دعوة عضو", icon: UserPlus },
];

export default async function DashboardPage() {
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind !== "member") redirect("/onboarding");
  const data = await getDashboard(ctx).catch(() => null);
  if (!data) redirect("/onboarding");
  const pref = await readBranchPref();
  const branches = pref ? data.branches.filter((b) => b.id === pref) : data.branches;
  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <section className="relative overflow-hidden rounded-xl bg-primary p-5 text-primary-foreground">
          <PatternTile className="pointer-events-none absolute inset-0 size-full opacity-10" />
          <div className="relative flex flex-col gap-1">
            <p className="text-sm opacity-90">أهلًا بك في</p>
            <p className="text-display-lg font-extrabold">{data.orgName}</p>
            <StatusBadge tone="neutral">{ROLE_NAMES[data.role] ?? data.role}</StatusBadge>
          </div>
        </section>
        <PageHeader title="نظرة عامة" />
        <div className="grid grid-cols-2 gap-3">
          <StatCard title="الفروع" value={branches.length} />
          <StatCard title="المجموعات" value={0} />
        </div>
        <section aria-label="اختصارات" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {QUICK.filter(
            (q) => q.href !== "/dashboard/team" || data.role !== "supervisor",
          ).map((q) => (
            <Link
              key={q.href}
              href={q.href}
              className="flex min-h-11 items-center gap-2 rounded-lg border border-border bg-surface-1 px-3 py-2 text-sm font-medium shadow-elevation-1 hover:bg-accent"
            >
              <IconChip tone="info" className="size-8">
                <q.icon className="size-4" />
              </IconChip>
              {q.label}
            </Link>
          ))}
        </section>
        {branches.length === 0 || data.programs.length === 0 ? (
          <EmptyState
            title="أكمل إعداد مركزك"
            description="أضف فرعك الأول وفعّل برامج التحفيظ من الإعدادات"
            action={
              <Link href="/dashboard/settings" className={buttonVariants({ size: "sm" })}>
                فتح الإعدادات
              </Link>
            }
          />
        ) : (
          <Card>
            <CardHeader>
              <CardTitle>الفروع ({branches.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-1 text-sm">
                {branches.map((b) => (
                  <li key={b.id}>{b.name}</li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}

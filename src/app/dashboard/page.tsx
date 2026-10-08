// الرئيسية: ترحيب + ملخص ما هو موجود في المركز.
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getDashboard } from "@/services/screens";
import { readBranchPref } from "@/services/branch-pref";
import { viewer } from "@/services/viewer";

const ROLE_NAMES: Record<string, string> = {
  center_admin: "مدير المركز",
  branch_admin: "مشرف فرع",
  teacher: "معلم",
};

export default async function DashboardPage() {
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind !== "member") redirect("/onboarding");
  const data = await getDashboard(ctx).catch(() => null);
  if (!data) redirect("/onboarding");
  const pref = await readBranchPref();
  const branches = pref ? data.branches.filter((b) => b.id === pref) : data.branches;
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">
        أهلًا بك في {data.orgName} — دورك: {ROLE_NAMES[data.role] ?? data.role}
      </h1>
      <Card>
        <CardHeader>
          <CardTitle>الفروع ({branches.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1">
            {branches.map((b) => (
              <li key={b.id}>{b.name}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>البرامج ({data.programs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1">
            {data.programs.map((p) => (
              <li key={p.id}>{p.label}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      {(data.role === "center_admin" || data.role === "branch_admin") && (
        <Link href="/dashboard/team" className={buttonVariants()}>
          إدارة الفريق
        </Link>
      )}
    </div>
  );
}

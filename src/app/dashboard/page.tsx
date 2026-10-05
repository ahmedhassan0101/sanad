// لوحة تحكم المركز (فارغة الآن: اسم + فرع + دور + برامج).
import Link from "next/link";
import { redirect } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { getDashboard } from "@/services/screens";
import { viewer } from "@/services/viewer";

const ROLE_NAMES: Record<string, string> = {
  center_admin: "مدير المركز",
  branch_admin: "مشرف فرع",
  teacher: "معلم",
};

export default async function DashboardPage() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  let data;
  try {
    data = await getDashboard(ctx);
  } catch {
    redirect("/onboarding");
  }
  const singleBranch = data.branches.length <= 1;
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">{data.orgName}</h1>
        <ThemeToggle />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>
            دورك: {ROLE_NAMES[data.role] ?? data.role}
            {!singleBranch && ` — ${data.branches.length} فروع`}
          </CardTitle>
        </CardHeader>
        {!singleBranch && (
          <CardContent>
            <h2 className="mb-2 text-sm font-medium">الفروع</h2>
            <ul className="flex flex-col gap-1">
              {data.branches.map((b) => (
                <li key={b.id}>{b.name}</li>
              ))}
            </ul>
          </CardContent>
        )}
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>البرامج</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-1">
            {data.programs.map((p) => (
              <li key={p.id}>{p.label}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>قريبًا</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">الطلاب والمجموعات والحضور — تُبنى في المرحلة الجاية.</p>
        </CardContent>
      </Card>
      <Separator />
      <Link href="/onboarding" className={buttonVariants({ variant: "ghost" })}>
        تبديل المركز
      </Link>
    </main>
  );
}

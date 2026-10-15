// صفحة الفريق: دعوات + أعضاء — للمشرفين فقط (الفحص في السيرفر).
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { cookies } from "next/headers";
import { viewer } from "@/services/viewer";
import { getTeamData } from "@/services/team";
import { revokeInviteAction } from "./actions";
import { InviteForm } from "./_invite-form";
import { MembersCard } from "./_members";
import { ROLE_NAMES_AR as ROLE_NAMES } from "@/constants/students";

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  if (ctx.role !== "center_admin" && ctx.role !== "branch_admin")
    redirect("/dashboard");
  const sp = await searchParams;
  const pref = (await cookies()).get("active_branch")?.value ?? null;
  const data = await getTeamData(ctx, pref).catch(() => null);
  if (!data) redirect("/dashboard");
  const roleValues =
    data.role === "center_admin"
      ? ["center_admin", "branch_admin", "supervisor"]
      : ["branch_admin", "supervisor"];
  const roles = roleValues.map((r) => ({ value: r, label: ROLE_NAMES[r] ?? r }));
  const branchName = new Map(data.branches.map((b) => [b.id, b.name]));
  return (
    <PageContainer>
    <div className="flex flex-col gap-4">
      <PageHeader title="الفريق" description="الدعوات والأعضاء — للمشرفين فقط" />
      {sp.error && (
        <p className="text-sm text-destructive">
          {sp.error === "1" ? "تعذر تنفيذ العملية — تحقق من الصلاحيات" : sp.error}
        </p>
      )}
      <InviteForm roles={roles} branches={data.branches} />
      <Card>
        <CardHeader>
          <CardTitle>الدعوات الفعّالة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.invites.length === 0 && (
            <p className="text-sm text-muted-foreground">لا دعوات فعّالة</p>
          )}
          {data.invites.map((i) => (
            <form
              key={i.id}
              action={revokeInviteAction.bind(null, i.id)}
              className="flex items-center justify-between gap-2 text-sm"
            >
              <span>
                {ROLE_NAMES[i.role]} —{" "}
                {i.branchId ? (branchName.get(i.branchId) ?? "") : "كل الفروع"}
              </span>
              <Button type="submit" variant="outline" size="sm">
                إلغاء
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
      <MembersCard members={data.members} roles={roles} />
    </div>
    </PageContainer>
  );
}

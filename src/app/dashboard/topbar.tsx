// الشريط العلوي: اسم المركز والفرع + المبدّلات + زر السمة + قائمة المستخدم.
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { StatusBadge } from "@/components/status-badge";
import { auth } from "@/lib/auth/config";
import { listMyMemberships } from "@/services/org-selection";
import { logoutAction, setBranchPrefAction } from "./actions";
import { setActiveOrg } from "../onboarding/actions";
import { MobileSidebar } from "./sidebar";
import { UserMenu } from "./_user-menu";

export async function Topbar({
  orgName,
  role,
  branches,
  branchPref,
}: {
  orgName: string;
  role: string;
  branches: { id: string; name: string }[];
  branchPref: string | null;
}) {
  const session = await auth();
  const memberships = session?.user?.id ? await listMyMemberships(session.user.id) : [];
  const branchName =
    branches.length > 1
      ? (branches.find((b) => b.id === branchPref)?.name ?? "كل الفروع")
      : (branches[0]?.name ?? "");
  async function logout() {
    "use server";
    await logoutAction();
  }
  return (
    <header className="flex items-center gap-2 border-b border-border bg-surface-1 p-3">
      <MobileSidebar role={role} />
      <div className="flex min-w-0 flex-col">
        <strong className="truncate text-base">{orgName}</strong>
        {branchName && (
          <span className="text-xs text-muted-foreground">{branchName}</span>
        )}
      </div>
      <div className="ms-auto flex items-center gap-2">
        {memberships.length > 1 && (
          <form action={setActiveOrg} className="hidden items-center gap-1 sm:flex">
            <select
              name="orgId"
              defaultValue=""
              aria-label="تبديل المركز"
              className="min-h-10 rounded-md border border-input bg-background px-2 text-sm"
              required
            >
              <option value="" disabled>
                تبديل المركز
              </option>
              {memberships.map((m) => (
                <option key={m.orgId} value={m.orgId}>
                  {m.orgName}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              دخول
            </Button>
          </form>
        )}
        {branches.length > 1 && (
          <form action={setBranchPrefAction} className="hidden items-center gap-1 sm:flex">
            <select
              name="branchId"
              defaultValue={branchPref ?? ""}
              aria-label="تبديل الفرع"
              className="min-h-10 rounded-md border border-input bg-background px-2 text-sm"
            >
              <option value="">كل الفروع</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Button type="submit" variant="outline" size="sm">
              عرض
            </Button>
          </form>
        )}
        <StatusBadge tone="neutral">{role === "center_admin" ? "مدير المركز" : role === "branch_admin" ? "مدير فرع" : "مشرف"}</StatusBadge>
        <ThemeToggle />
        <UserMenu
          name={session?.user?.name ?? "حسابي"}
          memberships={memberships}
          logout={logout}
        />
      </div>
    </header>
  );
}

// الشريط العلوي: اسم المركز + مبدّلات + قائمة المستخدم (خروج/سمة).
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { auth } from "@/lib/auth/config";
import { listMyMemberships } from "@/services/org-selection";
import { logoutAction, setBranchPrefAction } from "./actions";
import { setActiveOrg } from "../onboarding/actions";
import { MobileSidebar } from "./sidebar";

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
  async function logout() {
    "use server";
    await logoutAction();
  }
  return (
    <header className="flex items-center gap-2 border-b p-3">
      <MobileSidebar role={role} />
      <strong className="text-base">{orgName}</strong>
      <div className="ms-auto flex items-center gap-2">
        {memberships.length > 1 && (
          <form action={setActiveOrg} className="flex gap-1">
            <select name="orgId" defaultValue="" className="rounded-md border p-1 text-sm" required>
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
          <form action={setBranchPrefAction} className="flex gap-1">
            <select name="branchId" defaultValue={branchPref ?? ""} className="rounded-md border p-1 text-sm">
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
        <details className="relative">
          <summary className="cursor-pointer list-none rounded-md border px-3 py-1 text-sm">
            {session?.user?.name ?? "حسابي"}
          </summary>
          <div className="absolute end-0 top-full z-50 mt-1 flex w-40 flex-col gap-1 rounded-md border bg-background p-2 shadow-elevation-2">
            <ThemeToggle />
            <form action={logout}>
              <Button type="submit" variant="ghost" size="sm" className="w-full">
                خروج
              </Button>
            </form>
          </div>
        </details>
      </div>
    </header>
  );
}

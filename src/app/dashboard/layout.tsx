// إطار الداشبورد: شريط علوي + جانبي + المحتوى — للأعضاء فقط.
import { redirect } from "next/navigation";
import { getDashboard } from "@/services/screens";
import { readBranchPref } from "@/services/branch-pref";
import { viewer } from "@/services/viewer";
import { DesktopSidebar } from "./sidebar";
import { Topbar } from "./topbar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind !== "member") redirect("/onboarding");
  const data = await getDashboard(ctx).catch(() => null);
  if (!data) redirect("/onboarding");
  const pref = await readBranchPref();
  const validPref = data.branches.some((b) => b.id === pref) ? pref : null;
  return (
    <div className="flex min-h-svh flex-col">
      <Topbar orgName={data.orgName} role={data.role} branches={data.branches} branchPref={validPref} />
      <div className="flex flex-1">
        <DesktopSidebar role={data.role} />
        <main className="mx-auto w-full max-w-2xl flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}

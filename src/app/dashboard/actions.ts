// خروج من هذا الجهاز فقط (جلسة واحدة).
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { signOut } from "@/lib/auth/config";
import { activateBranchPref } from "@/services/org-selection";
import { viewer } from "@/services/viewer";

export async function logoutAction() {
  (await cookies()).delete("active_org");
  (await cookies()).delete("active_branch");
  await signOut({ redirectTo: "/login" });
}

export async function setBranchPrefAction(formData: FormData) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  const raw = String(formData.get("branchId") ?? "");
  try {
    const { branchId } = await activateBranchPref(ctx.userId, String(ctx.orgId), raw || null);
    const jar = await cookies();
    if (branchId) jar.set("active_branch", branchId, { httpOnly: true, sameSite: "lax", path: "/" });
    else jar.delete("active_branch");
  } catch {
    redirect("/dashboard");
  }
  redirect("/dashboard");
}

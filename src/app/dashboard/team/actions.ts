// أكشنات الفريق: إنشاء/إلغاء دعوة + تغيير دور/تعطيل عضو — كلها بفحص سيرفر.
"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createInvite, listInvites, revokeInvite } from "@/services/invites";
import { listBranches } from "@/services/branches-read";
import { listMembers, updateMember } from "@/services/members";
import { viewer } from "@/services/viewer";
import { inviteFormSchema } from "@/validators/forms";

async function teamCtx() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  if (ctx.role !== "center_admin" && ctx.role !== "branch_admin") redirect("/dashboard");
  return ctx;
}

export async function createInviteAction(formData: FormData) {
  const ctx = await teamCtx();
  const parsed = inviteFormSchema.safeParse({
    role: String(formData.get("role") ?? ""),
    branchId: formData.get("branchId") ? String(formData.get("branchId")) : null,
    days: Number(formData.get("days") ?? 2),
  });
  if (!parsed.success) redirect("/dashboard/team?error=1");
  try {
    const { code } = await createInvite(
      { userId: ctx.userId, orgId: ctx.orgId, role: ctx.role, branchIds: ctx.branchScope.mode === "list" ? ctx.branchScope.branchIds : [] },
      parsed.data.role,
      parsed.data.branchId ?? null,
      parsed.data.days
    );
    redirect(`/dashboard/team?created=${code}`);
  } catch {
    redirect("/dashboard/team?error=1");
  }
}

export async function revokeInviteAction(inviteId: string) {
  const ctx = await teamCtx();
  try {
    await revokeInvite(ctx, inviteId);
  } catch {
    redirect("/dashboard/team?error=1");
  }
  redirect("/dashboard/team");
}

export async function updateMemberAction(targetUserId: string, formData: FormData) {
  const ctx = await teamCtx();
  const role = formData.get("role");
  const status = formData.get("status");
  try {
    await updateMember(ctx, targetUserId, {
      ...(role ? { role: String(role) as "center_admin" | "branch_admin" | "teacher" } : {}),
      ...(status ? { status: String(status) as "active" | "disabled" } : {}),
    });
  } catch (e) {
    redirect(`/dashboard/team?error=${encodeURIComponent(e instanceof Error ? e.message : "1")}`);
  }
  redirect("/dashboard/team");
}

export async function teamData() {
  const ctx = await teamCtx();
  const pref = (await cookies()).get("active_branch")?.value ?? null;
  const [branches, members, invites] = await Promise.all([
    listBranches(ctx),
    listMembers(ctx),
    listInvites(ctx),
  ]);
  const validPref = branches.some((b) => String(b._id) === pref) ? pref : null;
  return {
    role: ctx.role,
    branches: branches.map((b) => ({ id: String(b._id), name: b.name })),
    members: validPref ? members.filter((m) => m.branchIds.includes(validPref)) : members,
    invites: validPref ? invites.filter((i) => !i.branchId || i.branchId === validPref) : invites,
  };
}

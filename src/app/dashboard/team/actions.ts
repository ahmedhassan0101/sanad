// أكشنات الفريق: إنشاء/إلغاء دعوة + تغيير دور/تعطيل عضو — كلها بفحص سيرفر.
"use server";

import { redirect } from "next/navigation";
import { isRedirectError } from "next/dist/client/components/redirect-error";
import { createInvite, revokeInvite } from "@/services/invites";
import { updateMember } from "@/services/members";
import { viewer } from "@/services/viewer";
import { inviteFormSchema } from "@/validators/forms";

async function teamCtx() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  if (ctx.role !== "center_admin" && ctx.role !== "branch_admin")
    redirect("/dashboard");
  return ctx;
}

// رسالة عربية قصيرة من خطأ الخدمة (تسقط البادئة الإنجليزية).
function publicMessage(e: unknown, fallback: string) {
  const m = e instanceof Error ? e.message : "";
  const stripped = m.replace(/^(VALIDATION|FORBIDDEN|NOT_FOUND|RATE_LIMITED|UNAUTHENTICATED|EXPIRED|TAKEN):\s*/, "");
  if (stripped && stripped !== m) return stripped;
  if (/^FORBIDDEN/.test(m)) return "لا صلاحية لديك لهذا الإجراء";
  if (/^NOT_FOUND/.test(m)) return "العنصر غير موجود أو انتهى";
  return fallback;
}

export async function createInviteAction(formData: FormData) {
  const ctx = await teamCtx();
  const parsed = inviteFormSchema.safeParse({
    role: String(formData.get("role") ?? ""),
    branchId: formData.get("branchId")
      ? String(formData.get("branchId"))
      : null,
    days: Number(formData.get("days") ?? 2),
  });
  if (!parsed.success) redirect("/dashboard/team?error=1");
  let code: string;
  try {
    ({ code } = await createInvite(
      {
        userId: ctx.userId,
        orgId: ctx.orgId,
        role: ctx.role,
        branchIds:
          ctx.branchScope.mode === "list" ? ctx.branchScope.branchIds : [],
      },
      parsed.data.role,
      parsed.data.branchId ?? null,
      parsed.data.days,
    ));
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("createInviteAction failed:", e);
    redirect(`/dashboard/team?error=${encodeURIComponent(publicMessage(e, "تعذر إنشاء الدعوة"))}`);
  }
  redirect(`/dashboard/team?created=${code}`);
}

export async function revokeInviteAction(inviteId: string) {
  const ctx = await teamCtx();
  try {
    await revokeInvite(ctx, inviteId);
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("revokeInviteAction failed:", e);
    redirect(`/dashboard/team?error=${encodeURIComponent(publicMessage(e, "تعذر إلغاء الدعوة"))}`);
  }
  redirect("/dashboard/team");
}

export async function updateMemberAction(
  targetUserId: string,
  formData: FormData,
) {
  const ctx = await teamCtx();
  const role = formData.get("role");
  const status = formData.get("status");
  try {
    await updateMember(ctx, targetUserId, {
      ...(role
        ? { role: String(role) as "center_admin" | "branch_admin" | "supervisor" }
        : {}),
      ...(status ? { status: String(status) as "active" | "disabled" } : {}),
    });
  } catch (e) {
    if (isRedirectError(e)) throw e;
    console.error("updateMemberAction failed:", e);
    redirect(`/dashboard/team?error=${encodeURIComponent(publicMessage(e, "تعذر تحديث العضو"))}`);
  }
  redirect("/dashboard/team");
}

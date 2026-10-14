// أكشنات الفريق: إنشاء/إلغاء دعوة + تغيير دور/تعطيل عضو — كلها بفحص سيرفر.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createInvite, revokeInvite } from "@/services/invites";
import { updateMember } from "@/services/members";
import { viewer } from "@/services/viewer";
import { inviteFormSchema } from "@/validators/forms";

// مدة الدعوة ثابتة: 48 ساعة.
const INVITE_DAYS = 2;

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

export type InviteState = { ok: boolean; code?: string; message?: string };

export async function createInviteAction(
  _prev: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const ctx = await teamCtx();
  const parsed = inviteFormSchema.safeParse({
    role: String(formData.get("role") ?? ""),
    branchId: formData.get("branchId")
      ? String(formData.get("branchId"))
      : null,
  });
  if (!parsed.success) return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    const { code } = await createInvite(
      {
        userId: ctx.userId,
        orgId: ctx.orgId,
        role: ctx.role,
        branchIds:
          ctx.branchScope.mode === "list" ? ctx.branchScope.branchIds : [],
      },
      parsed.data.role,
      parsed.data.branchId ?? null,
      INVITE_DAYS,
    );
    revalidatePath("/dashboard/team");
    return { ok: true, code };
  } catch (e) {
    console.error("createInviteAction failed:", e);
    return { ok: false, message: publicMessage(e, "تعذر إنشاء الدعوة") };
  }
}

export async function revokeInviteAction(inviteId: string) {
  const ctx = await teamCtx();
  try {
    await revokeInvite(ctx, inviteId);
  } catch (e) {
    console.error("revokeInviteAction failed:", e);
    redirect(`/dashboard/team?error=${encodeURIComponent(publicMessage(e, "تعذر إلغاء الدعوة"))}`);
  }
  revalidatePath("/dashboard/team");
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
    console.error("updateMemberAction failed:", e);
    redirect(`/dashboard/team?error=${encodeURIComponent(publicMessage(e, "تعذر تحديث العضو"))}`);
  }
  revalidatePath("/dashboard/team");
}

// أكشنات الفروع: إنشاء/تعديل/أرشفة — كلها بفحص سيرفر.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { archiveBranch, createBranch, renameBranch } from "@/services/branches";
import { viewer } from "@/services/viewer";

function failMsg(e: unknown, fallback: string) {
  const m = e instanceof Error ? e.message : "";
  const stripped = m.replace(/^(VALIDATION|FORBIDDEN|NOT_FOUND):\s*/, "");
  return `/dashboard/branches?error=${encodeURIComponent(stripped && stripped !== m ? stripped : /^FORBIDDEN/.test(m) ? "لا صلاحية لديك" : fallback)}`;
}

export async function createBranchAction(formData: FormData) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  try {
    await createBranch(ctx, String(formData.get("name") ?? ""));
  } catch (e) {
    redirect(failMsg(e, "تعذر إنشاء الفرع"));
  }
  revalidatePath("/dashboard/branches");
}

export async function renameBranchAction(id: string, formData: FormData) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  try {
    await renameBranch(ctx, id, String(formData.get("name") ?? ""));
  } catch (e) {
    redirect(failMsg(e, "تعذر تعديل الفرع"));
  }
  revalidatePath("/dashboard/branches");
}

export async function archiveBranchAction(id: string) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  try {
    await archiveBranch(ctx, id);
  } catch (e) {
    redirect(failMsg(e, "تعذر أرشفة الفرع"));
  }
  revalidatePath("/dashboard/branches");
}

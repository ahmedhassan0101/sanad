// إجراء إنشاء مجموعة — Server Action يُستدعى من العميل ويحل السياق داخلياً.
"use server";

import { redirect } from "next/navigation";
import { createGroup } from "@/services/groups";
import { viewer } from "@/services/viewer";

async function memberCtx() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  return ctx;
}

export async function createGroupAction(values: unknown) {
  const ctx = await memberCtx();
  try {
    const res = await createGroup(ctx, values as Parameters<typeof createGroup>[1]);
    return { ok: true, groupId: res.groupId };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر إضافة المجموعة" };
  }
}

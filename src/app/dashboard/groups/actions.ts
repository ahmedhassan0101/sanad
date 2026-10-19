// إجراءات المجموعات — Server Actions تُستدعى من العميل وتحل السياق داخلياً.
"use server";

import { redirect } from "next/navigation";
import { createGroup, updateGroup, type UpdateGroupInput } from "@/services/groups";
import { searchStudentsForGroup } from "@/services/groups";
import { viewer } from "@/services/viewer";
import type { SessionContext } from "@/lib/tenant/context";

type MemberCtx = Extract<SessionContext, { kind: "member" }>;

async function memberCtx() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  return ctx as MemberCtx;
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

export async function updateGroupAction(id: string, values: unknown) {
  const ctx = await memberCtx();
  try {
    await updateGroup(ctx, id, values as UpdateGroupInput);
    return { ok: true, groupId: id };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر التعديل" };
  }
}

export async function searchStudentsAction({
  groupId,
  activityKey,
  q,
}: {
  groupId?: string;
  activityKey: string;
  q: string;
}) {
  const session = await viewer();
  const ctx = session as MemberCtx;
  return searchStudentsForGroup(ctx, { groupId, activityKey, q });
}

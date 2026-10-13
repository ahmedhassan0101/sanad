// أكشنات سريعة من القائمة: أرشفة/استرجاع — نفس نمط redirect الموجود في المشروع.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { archiveStudent, restoreStudent } from "@/services/students";
import { viewer } from "@/services/viewer";

export async function archiveStudentAction(id: string): Promise<void> {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  try {
    await archiveStudent(ctx, id);
  } catch {
    redirect("/dashboard/students?error=1");
  }
  revalidatePath("/dashboard/students");
}

export async function restoreStudentAction(id: string): Promise<void> {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  try {
    await restoreStudent(ctx, id);
  } catch {
    redirect("/dashboard/students?error=1");
  }
  revalidatePath("/dashboard/students");
}

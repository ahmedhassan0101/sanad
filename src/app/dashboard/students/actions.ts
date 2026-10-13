// أكشنات سريعة من القائمة: أرشفة/استرجاع — نفس نمط redirect الموجود في المشروع.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveStudent,
  createStudent,
  deleteStudentPermanently,
  regenerateParentCode,
  restoreStudent,
  updateStudent,
} from "@/services/students";
import { viewer } from "@/services/viewer";
import {
  createStudentSchema,
  updateStudentSchema,
  type StudentFormInput,
} from "@/validators/students";

export type StudentActionResult = {
  ok: boolean;
  message: string;
  code?: string;
  duplicate?: { id: string; name: string };
};

async function memberCtx() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  return ctx;
}

export async function createStudentAction(values: StudentFormInput): Promise<StudentActionResult> {
  const ctx = await memberCtx();
  const parsed = createStudentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    const res = await createStudent(ctx, parsed.data);
    if (res.status === "duplicate") {
      return { ok: false, message: "يوجد طالب مشابه", code: "DUPLICATE_WARNING", duplicate: res.duplicate };
    }
    redirect(`/dashboard/students/${res.id}`);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر الحفظ" };
  }
}

export async function updateStudentAction(
  id: string,
  values: StudentFormInput,
): Promise<StudentActionResult> {
  const ctx = await memberCtx();
  const parsed = updateStudentSchema.safeParse(values);
  if (!parsed.success) return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    const res = await updateStudent(ctx, id, parsed.data);
    if (res.status === "duplicate") {
      return { ok: false, message: "يوجد طالب مشابه", code: "DUPLICATE_WARNING", duplicate: res.duplicate };
    }
    redirect(`/dashboard/students/${id}`);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر الحفظ" };
  }
}

export async function deleteStudentAction(id: string): Promise<StudentActionResult> {
  const ctx = await memberCtx();
  try {
    await deleteStudentPermanently(ctx, id);
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر الحذف" };
  }
  redirect("/dashboard/students");
}

export async function regenerateCodeAction(id: string): Promise<StudentActionResult & { parentCode?: string }> {
  const ctx = await memberCtx();
  try {
    const { parentCode } = await regenerateParentCode(ctx, id);
    revalidatePath(`/dashboard/students/${id}`);
    return { ok: true, message: "تم التجديد", parentCode };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر التجديد" };
  }
}

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

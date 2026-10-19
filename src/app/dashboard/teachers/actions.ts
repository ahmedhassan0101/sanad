// أكشنات المعلمين: إنشاء/تعديل/حذف/أرشفة — نفس نمط أكشنات الطلاب.
"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  archiveTeacher,
  createTeacher,
  deleteTeacherPermanently,
  restoreTeacher,
  updateTeacher,
} from "@/services/teachers";
import { errorMessage } from "@/lib/app-error";
import { viewer } from "@/services/viewer";
import {
  createTeacherSchema,
  updateTeacherSchema,
  type TeacherFormInput,
} from "@/validators/teachers";

export type TeacherActionResult = {
  ok: boolean;
  message: string;
  code?: string;
  duplicate?: { id: string; name: string };
  id?: string;
};

async function memberCtx() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  return ctx;
}

export async function createTeacherAction(
  values: TeacherFormInput,
): Promise<TeacherActionResult> {
  const ctx = await memberCtx();
  const parsed = createTeacherSchema.safeParse(values);
  if (!parsed.success)
    return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    const res = await createTeacher(ctx, parsed.data);
    if (res.status === "duplicate") {
      return {
        ok: false,
        message: "يوجد معلم مشابه",
        code: "DUPLICATE_WARNING",
        duplicate: res.duplicate,
      };
    }
    return { ok: true, message: "تمت إضافة المعلم", id: res.id };
  } catch (e) {
    return {
      ok: false,
      message: errorMessage(e),
    };
  }
}

export async function updateTeacherAction(
  id: string,
  values: TeacherFormInput,
): Promise<TeacherActionResult> {
  const ctx = await memberCtx();
  const parsed = updateTeacherSchema.safeParse(values);
  if (!parsed.success)
    return { ok: false, message: "تحقق من الحقول ثم حاول مجددًا" };
  try {
    const res = await updateTeacher(ctx, id, parsed.data);
    if (res.status === "duplicate") {
      return {
        ok: false,
        message: "يوجد معلم مشابه",
        code: "DUPLICATE_WARNING",
        duplicate: res.duplicate,
      };
    }
    return { ok: true, message: "تم حفظ التعديلات", id };
  } catch (e) {
    return {
      ok: false,
      message: errorMessage(e),
    };
  }
}

export async function deleteTeacherAction(
  id: string,
): Promise<TeacherActionResult> {
  const ctx = await memberCtx();
  try {
    await deleteTeacherPermanently(ctx, id);
  } catch (e) {
    return {
      ok: false,
      message: errorMessage(e),
    };
  }
  redirect("/dashboard/teachers");
}

export async function archiveTeacherAction(id: string): Promise<void> {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  try {
    await archiveTeacher(ctx, id);
  } catch {
    redirect("/dashboard/teachers?error=1");
  }
  revalidatePath("/dashboard/teachers");
}

export async function restoreTeacherAction(id: string): Promise<void> {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  try {
    await restoreTeacher(ctx, id);
  } catch {
    redirect("/dashboard/teachers?error=1");
  }
  revalidatePath("/dashboard/teachers");
}

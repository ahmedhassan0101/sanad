// أكشن الحفظ الجماعي: يرد نتيجة كل صف (لا تحويل — الجدول يحدّث نفسه).
"use server";

import { createStudentsBulk, type BulkRowResult } from "@/services/students";
import { viewer } from "@/services/viewer";

export async function bulkSaveAction(
  rows: unknown[],
  branchId: string | null,
  confirmRows: number[],
): Promise<{ ok: true; results: BulkRowResult[] } | { ok: false; message: string }> {
  const ctx = await viewer();
  if (ctx.kind !== "member") return { ok: false, message: "سجّل الدخول أولًا" };
  try {
    const results = await createStudentsBulk(ctx, rows, { branchId: branchId ?? undefined, confirmDuplicateRows: confirmRows });
    return { ok: true, results };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر الحفظ" };
  }
}

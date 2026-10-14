// أكشن الحفظ الجماعي: يرد نتيجة كل صف (لا تحويل — الجدول يحدّث نفسه).
"use server";

import { parseStudentWorkbook, type ParsedImportRow } from "@/lib/excel-import";
import {
  createStudentsBulk,
  previewBulkImport,
  type BulkRowResult,
  type PreviewRow,
} from "@/services/students";
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

export type { BulkRowResult, PreviewRow };

// معاينة: قراءة الملف + تحقق + تكرار، بدون أي كتابة ولا ملفات مؤقتة.
export async function previewImportAction(
  formData: FormData,
  branchId: string | null,
): Promise<{ ok: true; rows: PreviewRow[] } | { ok: false; message: string }> {
  const ctx = await viewer();
  if (ctx.kind !== "member") return { ok: false, message: "سجّل الدخول أولًا" };
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { ok: false, message: "اختر ملفًا" };
  try {
    const parsed: ParsedImportRow[] = await parseStudentWorkbook(await file.arrayBuffer());
    const rows = await previewBulkImport(ctx, parsed, { branchId: branchId ?? undefined });
    return { ok: true, rows };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر قراءة الملف" };
  }
}

// الحفظ من المعاينة: يعيد التحقق كاملًا ثم ينادي الخدمة الجماعية.
export async function commitImportAction(
  rows: { excelRow: number; data: Record<string, unknown> }[],
  branchId: string | null,
  includeDuplicates: boolean,
): Promise<{ ok: true; results: (BulkRowResult & { excelRow: number })[] } | { ok: false; message: string }> {
  const ctx = await viewer();
  if (ctx.kind !== "member") return { ok: false, message: "سجّل الدخول أولًا" };
  try {
    const previewed = await previewBulkImport(ctx, rows, { branchId: branchId ?? undefined });
    const valid = previewed.filter((r) => r.status === "valid");
    const dups = includeDuplicates ? previewed.filter((r) => r.status === "duplicate") : [];
    const toSave = [...valid, ...dups];
    const confirmDuplicateRows = toSave.map((_, i) => (i >= valid.length ? i : -1)).filter((i) => i >= 0);
    const results = await createStudentsBulk(
      ctx,
      toSave.map((r) => r.data),
      { branchId: branchId ?? undefined, confirmDuplicateRows },
    );
    const byIndex = new Map(results.map((x) => [x.index, x]));
    return {
      ok: true,
      results: toSave.map((r, i) => ({ ...(byIndex.get(i) ?? { index: i, status: "invalid" as const, errors: ["تعذر الحفظ"] }), excelRow: r.excelRow })),
    };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "تعذر الحفظ" };
  }
}

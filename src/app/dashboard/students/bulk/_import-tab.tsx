// تبويب استيراد Excel: نموذج ← رفع ← معاينة ← حفظ. Client Component للسحب والإفلات.
// (اخترت Drag&Drop مع زر اختيار كبديل بسيط يعمل على الموبايل بدل مكتبة رفع.)
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { PreviewRow } from "@/services/students";
import { commitImportAction, previewImportAction } from "./actions";

const STATUS_AR: Record<PreviewRow["status"], string> = {
  valid: "سليم",
  duplicate: "مكرر",
  invalid: "خطأ",
};

export function ImportTab({
  branches,
  showBranch,
}: {
  branches: { id: string; name: string }[];
  showBranch: boolean;
}) {
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<PreviewRow[] | null>(null);
  const [errorsOnly, setErrorsOnly] = useState(false);
  const [includeDup, setIncludeDup] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);
  const [failed, setFailed] = useState<{ excelRow: number; errors: string[] }[]>([]);

  const sel = "rounded-md border border-input bg-background p-1.5 text-sm";

  const upload = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true);
    setError(null);
    setRows(null);
    setSummary(null);
    setFailed([]);
    const fd = new FormData();
    fd.append("file", file);
    const res = await previewImportAction(fd, showBranch ? branchId || null : null);
    setBusy(false);
    if (!res.ok) {
      setError(res.message);
      toast.error(res.message);
      return;
    }
    setRows(res.rows);
  };

  const shown = (rows ?? []).filter((r) => !errorsOnly || r.status !== "valid");
  const validCount = (rows ?? []).filter((r) => r.status === "valid").length;
  const dupCount = (rows ?? []).filter((r) => r.status === "duplicate").length;

  const save = async () => {
    if (!rows) return;
    setBusy(true);
    const res = await commitImportAction(
      rows.map((r) => ({ excelRow: r.excelRow, data: r.data })),
      showBranch ? branchId || null : null,
      includeDup,
    );
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    // الملخص من نتيجة الخدمة لكل صف — لا من عدّ المعاينة.
    const saved = res.results.filter((r) => r.status === "saved").length;
    const bad = res.results
      .filter((r) => r.status !== "saved")
      .map((r) => ({ excelRow: r.excelRow, errors: r.status === "duplicate" ? ["مكرر"] : r.errors }));
    setFailed(bad);
    setSummary(`تم حفظ ${saved} طالب${bad.length > 0 ? `، وفشل ${bad.length}` : ""}`);
    toast.success(`تم حفظ ${saved} طالب`);
  };

  const downloadFailed = () => {
    const lines = ["رقم الصف,الأخطاء", ...failed.map((f) => `${f.excelRow},"${f.errors.join(" | ")}"`)];
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "failed-rows.csv";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  return (
    <div className="flex flex-col gap-3">
      <Card>
        <CardHeader>
          <CardTitle>خطوة ١: حمّل النموذج</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2 text-sm">
          <a href="/students-template.xlsx" download className="underline underline-offset-4">
            تنزيل نموذج Excel
          </a>
          <p className="text-muted-foreground">
            من Google Sheets: ملف ← تنزيل ← Excel (.xlsx). املأ ورقة البيانات فقط.
          </p>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>خطوة ٢: ارفع الملف (.xlsx حتى 5MB)</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {showBranch && (
            <label className="flex max-w-xs flex-col gap-1 text-sm">
              الفرع
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={sel}>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              void upload(e.dataTransfer.files?.[0]);
            }}
            className={`rounded-md border border-dashed p-6 text-center text-sm ${drag ? "border-primary bg-muted" : ""}`}
          >
            اسحب الملف هنا أو
            <label className="mx-1 cursor-pointer underline underline-offset-4">
              اختره
              <Input
                type="file"
                accept=".xlsx"
                className="hidden"
                onChange={(e) => {
                  void upload(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          {busy && <p className="text-sm text-muted-foreground">جارٍ المعالجة…</p>}
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
      {rows && (
        <Card>
          <CardHeader>
            <CardTitle>خطوة ٣: المعاينة قبل الحفظ ({rows.length} صف)</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={errorsOnly} onChange={(e) => setErrorsOnly(e.target.checked)} />
              الأخطاء فقط
            </label>
            <div className="overflow-x-auto rounded-md border">
              <table className="w-full min-w-120 text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="p-1.5 text-start">صف</th>
                    <th className="p-1.5 text-start">الحالة</th>
                    <th className="p-1.5 text-start">التفاصيل</th>
                  </tr>
                </thead>
                <tbody>
                  {shown.map((r, i) => (
                    <tr key={i} className="border-b last:border-0">
                      <td className="p-1.5" dir="ltr">{r.excelRow}</td>
                      <td className="p-1.5">{STATUS_AR[r.status]}</td>
                      <td className="p-1.5 text-xs">
                        {r.status === "duplicate"
                          ? `مكرر${r.duplicate?.name ? `: ${r.duplicate.name}` : ""}`
                          : r.errors.map((e) => `${e.column}: ${e.message}`).join("، ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={includeDup} onChange={(e) => setIncludeDup(e.target.checked)} />
              إضافة المكرر ({dupCount})
            </label>
            <Button disabled={busy || validCount + (includeDup ? dupCount : 0) === 0} onClick={save}>
              {busy ? "جارٍ الحفظ…" : `حفظ الصفوف السليمة (${validCount + (includeDup ? dupCount : 0)})`}
            </Button>
            {summary && <p role="status" className="text-sm text-muted-foreground">{summary}</p>}
            {failed.length > 0 && (
              <Button type="button" variant="outline" onClick={downloadFailed}>
                تحميل ملف الصفوف الفاشلة
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

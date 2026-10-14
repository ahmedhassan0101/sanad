// جدول الإدخال السريع: 10 صفوف مبدئية، لصق TSV، تحقق فوري، حفظ جماعي.
// Client Component — تفاعل الخلايا واللصق لا يعملان في Server Component.
"use client";

import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { GENDERS, LEVELS, GUARDIAN_RELATIONS } from "@/constants/students";
import { cleanPhone, toOptionKey } from "@/lib/students";
import { parseTSV } from "@/lib/tsv";
import { createStudentSchema } from "@/validators/students";
import { bulkSaveAction } from "./actions";

const COLS = ["name", "gender", "level", "birthDate", "relation", "guardianPhone"] as const;
type Col = (typeof COLS)[number];

interface Row {
  key: number;
  name: string;
  gender: string;
  level: string;
  birthDate: string;
  relation: string;
  guardianPhone: string;
  errors: Partial<Record<Col, string>>;
  serverMsg: string | null;
  duplicate: boolean;
  confirmed: boolean;
}

const MAX_ROWS = 200;
let nextKey = 1;
const blankRow = (): Row => ({
  key: nextKey++,
  name: "",
  gender: "",
  level: "beginner",
  birthDate: "",
  relation: "father",
  guardianPhone: "",
  errors: {},
  serverMsg: null,
  duplicate: false,
  confirmed: false,
});

function isEmptyRow(r: Row) {
  return !r.name.trim() && !r.guardianPhone.trim() && !r.birthDate.trim();
}

// تنظيف + تحويل عربي ← مفاتيح، ثم تحقق بنفس مخطط الأحادي.
function toInput(r: Row) {
  const gender = toOptionKey(r.gender, GENDERS) ?? r.gender;
  const level = toOptionKey(r.level, LEVELS) ?? r.level;
  const relation = toOptionKey(r.relation, GUARDIAN_RELATIONS) ?? r.relation;
  const phone = cleanPhone(r.guardianPhone);
  return {
    name: r.name.trim(),
    gender,
    level,
    birthDate: r.birthDate.trim() || undefined,
    guardians: phone ? [{ relation, phone }] : [],
  };
}

function validateRow(r: Row): Partial<Record<Col, string>> {
  const parsed = createStudentSchema.safeParse({ ...toInput(r), branchId: undefined });
  if (parsed.success) return {};
  const errors: Partial<Record<Col, string>> = {};
  for (const issue of parsed.error.issues) {
    const path = issue.path.join(".");
    if (path === "name") errors.name = issue.message;
    else if (path === "gender") errors.gender = issue.message;
    else if (path === "level") errors.level = issue.message;
    else if (path === "birthDate") errors.birthDate = issue.message;
    else if (path.startsWith("guardians")) {
      if (path.endsWith("relation")) errors.relation = issue.message;
      else errors.guardianPhone = issue.message;
    }
  }
  return errors;
}

export function BulkTable({
  branches,
  showBranch,
}: {
  branches: { id: string; name: string }[];
  showBranch: boolean;
}) {
  const [rows, setRows] = useState<Row[]>(() => Array.from({ length: 10 }, blankRow));
  const [branchId, setBranchId] = useState(branches[0]?.id ?? "");
  const [busy, setBusy] = useState(false);
  const [summary, setSummary] = useState<string | null>(null);

  const patchRow = (key: number, patch: Partial<Row>) =>
    setRows((rs) => rs.map((r) => (r.key === key ? { ...r, ...patch, serverMsg: null } : r)));

  const setCell = (key: number, col: Col, value: string) =>
    setRows((rs) =>
      rs.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, [col]: value };
        return { ...next, errors: isEmptyRow(next) ? {} : validateRow(next) };
      }),
    );

  const onPaste = (key: number, col: Col, e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData("text");
    if (!text.includes("\t") && !text.includes("\n")) return;
    e.preventDefault();
    const matrix = parseTSV(text);
    const startRow = rows.findIndex((r) => r.key === key);
    const startCol = COLS.indexOf(col);
    setRows((rs) => {
      const next = [...rs];
      matrix.forEach((cells, ri) => {
        let target = next[startRow + ri];
        if (!target && next.length < MAX_ROWS) {
          target = blankRow();
          next.push(target);
        }
        if (!target) return;
        cells.forEach((cell, ci) => {
          const c = COLS[startCol + ci];
          if (c) (target as unknown as Record<string, string>)[c] = cell;
        });
        const validated = { ...target, errors: validateRow(target) as Row["errors"] };
        next[startRow + ri] = validated;
      });
      return next;
    });
  };

  const activeRows = useMemo(() => rows.filter((r) => !isEmptyRow(r)), [rows]);
  const allValid = activeRows.length > 0 && activeRows.every((r) => Object.keys(validateRow(r)).length === 0);

  const save = async () => {
    setBusy(true);
    setSummary(null);
    const payload = activeRows.map((r) => toInput(r));
    const confirmRows = activeRows.map((r, i) => (r.confirmed ? i : -1)).filter((i) => i >= 0);
    const res = await bulkSaveAction(payload, showBranch ? branchId || null : null, confirmRows);
    setBusy(false);
    if (!res.ok) {
      toast.error(res.message);
      return;
    }
    const byIndex = new Map(res.results.map((x) => [x.index, x]));
    let saved = 0, dup = 0, bad = 0;
    const kept: Row[] = [];
    activeRows.forEach((r, i) => {
      const out = byIndex.get(i);
      if (!out || out.status === "saved") {
        saved++;
        return;
      }
      if (out.status === "duplicate") {
        dup++;
        kept.push({ ...r, duplicate: true, serverMsg: `مكرر: ${out.duplicate?.name ?? ""}` });
      } else {
        bad++;
        kept.push({ ...r, serverMsg: out.errors.join("، ") });
      }
    });
    const empties = rows.filter((r) => isEmptyRow(r));
    setRows([...kept, ...empties]);
    setSummary(`تم حفظ ${saved}، مكرر ${dup}، أخطاء ${bad}`);
    toast.success(`تم حفظ ${saved} طالب`);
  };

  const sel = "rounded-md border border-input bg-background p-1.5 text-sm disabled:opacity-50";

  return (
    <div className="flex flex-col gap-3">
      {showBranch && (
        <label className="flex max-w-xs flex-col gap-1 text-sm">
          الفرع (للدفعة كلها)
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} className={sel}>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        </label>
      )}
      {summary && <p role="status" className="text-sm text-muted-foreground">{summary}</p>}
      <div className="overflow-x-auto rounded-md border">
        <table className="w-full min-w-200 text-sm" onPaste={(e) => {
          const t = e.target as HTMLElement;
          const key = Number(t.dataset.row);
          const col = t.dataset.col as Col;
          if (key && col) onPaste(key, col, e);
        }}>
          <thead>
            <tr className="border-b text-muted-foreground">
              <th className="p-1.5 text-start">الاسم*</th>
              <th className="p-1.5 text-start">النوع*</th>
              <th className="p-1.5 text-start">المستوى*</th>
              <th className="p-1.5 text-start">الميلاد</th>
              <th className="p-1.5 text-start">الصلة</th>
              <th className="p-1.5 text-start">هاتف الولي</th>
              <th className="p-1.5 text-start" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.key} className="border-b last:border-0">
                <td className="p-1">
                  <Input data-row={r.key} data-col="name" value={r.name} onChange={(e) => setCell(r.key, "name", e.target.value)} placeholder="الاسم" aria-invalid={!!r.errors.name} />
                  {r.errors.name && <p className="text-xs text-destructive">{r.errors.name}</p>}
                </td>
                <td className="p-1">
                  <select data-row={r.key} data-col="gender" value={r.gender} onChange={(e) => setCell(r.key, "gender", e.target.value)} className={sel} aria-invalid={!!r.errors.gender}>
                    <option value="">—</option>
                    {GENDERS.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {r.errors.gender && <p className="text-xs text-destructive">{r.errors.gender}</p>}
                </td>
                <td className="p-1">
                  <select data-row={r.key} data-col="level" value={r.level} onChange={(e) => setCell(r.key, "level", e.target.value)} className={sel} aria-invalid={!!r.errors.level}>
                    {LEVELS.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                  {r.errors.level && <p className="text-xs text-destructive">{r.errors.level}</p>}
                </td>
                <td className="p-1">
                  <Input data-row={r.key} data-col="birthDate" value={r.birthDate} onChange={(e) => setCell(r.key, "birthDate", e.target.value)} placeholder="2016-05-01" dir="ltr" aria-invalid={!!r.errors.birthDate} />
                  {r.errors.birthDate && <p className="text-xs text-destructive">{r.errors.birthDate}</p>}
                </td>
                <td className="p-1">
                  <select data-row={r.key} data-col="relation" value={r.relation} onChange={(e) => setCell(r.key, "relation", e.target.value)} className={sel}>
                    {GUARDIAN_RELATIONS.options.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </td>
                <td className="p-1">
                  <Input data-row={r.key} data-col="guardianPhone" value={r.guardianPhone} onChange={(e) => setCell(r.key, "guardianPhone", e.target.value)} placeholder="01xxxxxxxxx" dir="ltr" aria-invalid={!!r.errors.guardianPhone} />
                  {r.errors.guardianPhone && <p className="text-xs text-destructive">{r.errors.guardianPhone}</p>}
                </td>
                <td className="p-1">
                  <Button type="button" variant="ghost" size="sm" onClick={() => setRows((rs) => rs.filter((x) => x.key !== r.key))}>
                    حذف
                  </Button>
                  {r.serverMsg && <p className="text-xs text-warning-muted-foreground">{r.serverMsg}</p>}
                  {r.duplicate && (
                    <label className="flex items-center gap-1 text-xs">
                      <input type="checkbox" checked={r.confirmed} onChange={(e) => patchRow(r.key, { confirmed: e.target.checked })} />
                      إضافة رغم التكرار
                    </label>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" disabled={rows.length >= MAX_ROWS} onClick={() => setRows((rs) => [...rs, ...Array.from({ length: Math.min(10, MAX_ROWS - rs.length) }, blankRow)])}>
          إضافة 10 صفوف
        </Button>
        <Button type="button" disabled={!allValid || busy} onClick={save}>
          {busy ? "جارٍ الحفظ…" : `حفظ (${activeRows.length})`}
        </Button>
      </div>
    </div>
  );
}

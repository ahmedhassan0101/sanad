// شريط فلاتر الطلاب: بحث (debounce) + قوائم — الحالة في الـ URL عبر nuqs.
// ملاحظة: shallow:false ضروري — بدونه يتحدث الـ URL دون إعادة تشغيل الـ Server Component.
"use client";

import { parseAsBoolean, parseAsString, useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GENDERS, LEVELS, STUDENT_STATUS } from "@/constants/students";

export function StudentsToolbar() {
  const [q, setQ] = useQueryState(
    "q",
    parseAsString
      .withOptions({ clearOnDefault: true, throttleMs: 400, shallow: false })
      .withDefault(""),
  );
  const [level, setLevel] = useQueryState(
    "level",
    parseAsString.withOptions({ clearOnDefault: true, shallow: false }).withDefault(""),
  );
  const [gender, setGender] = useQueryState(
    "gender",
    parseAsString.withOptions({ clearOnDefault: true, shallow: false }).withDefault(""),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withOptions({ shallow: false }).withDefault("active"),
  );
  const [incomplete, setIncomplete] = useQueryState(
    "incomplete",
    parseAsBoolean.withOptions({ shallow: false }).withDefault(false),
  );

  const pick = (
    label: string,
    value: string,
    onChange: (v: string | null) => void,
    allLabel: string,
    options: { value: string; label: string }[],
    allowAll = true,
  ) => (
    <label className="flex min-w-36 flex-1 flex-col gap-1 text-sm">
      {label}
      <Select
        value={value}
        onValueChange={onChange}
        items={Object.fromEntries([
          ...(allowAll ? [["__all", "الكل"] as const] : []),
          ...options.map((o) => [o.value, o.label] as const),
        ])}
      >
        <SelectTrigger>
          <SelectValue placeholder={allLabel} />
        </SelectTrigger>
        <SelectContent>
          {allowAll && <SelectItem value="__all">الكل</SelectItem>}
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value || null)}
        placeholder="بحث بالاسم أو الهاتف…"
      />
      <div className="flex flex-wrap gap-2">
        {pick(
          "المستوى",
          level || "__all",
          (v) => setLevel(v === "__all" ? null : v),
          "الكل",
          LEVELS.options,
        )}
        {pick(
          "النوع",
          gender || "__all",
          (v) => setGender(v === "__all" ? null : v),
          "الكل",
          GENDERS.options,
        )}
        {pick(
          "الحالة",
          status,
          (v) => setStatus(v),
          "الكل",
          STUDENT_STATUS.options,
          false,
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={incomplete}
            onChange={(e) => setIncomplete(e.target.checked || null)}
          />
          بيانات ناقصة
        </label>
        <label className="flex min-w-36 flex-1 flex-col gap-1 text-sm opacity-60">
          النشاط
          <Input disabled placeholder="بعد إضافة المجموعات" />
        </label>
      </div>
    </div>
  );
}

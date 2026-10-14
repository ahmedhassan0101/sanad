
// شريط فلاتر المعلمين: بحث (debounce) + حالة — الحالة في الـ URL عبر nuqs.
"use client";

import { parseAsString, useQueryState } from "nuqs";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TEACHER_STATUS } from "@/constants/teachers";

export function TeachersToolbar() {
  const [q, setQ] = useQueryState(
    "q",
    parseAsString
      .withOptions({ clearOnDefault: true, throttleMs: 400, shallow: false })
      .withDefault(""),
  );
  const [status, setStatus] = useQueryState(
    "status",
    parseAsString.withOptions({ shallow: false }).withDefault("active"),
  );

  return (
    <div className="flex flex-col gap-2">
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value || null)}
        placeholder="بحث بالاسم أو الهاتف…"
      />
      <div className="flex flex-wrap gap-2">
        <label className="flex min-w-36 flex-1 flex-col gap-1 text-sm">
          الحالة
          <Select value={status} onValueChange={(v) => setStatus(v)}>
            <SelectTrigger>
              <SelectValue placeholder="الكل" />
            </SelectTrigger>
            <SelectContent>
              {TEACHER_STATUS.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>
      </div>
    </div>
  );
}

// مكون اختيار الطلاب — قابل لإعادة الاستخدام في فورم إنشاء المجموعة ونافذة إضافة الطلاب.
// بحث لحظي عبر searchStudentsAction مع عرض ملاحظة "مسجل في: ...".
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { searchStudentsAction } from "./actions";

interface StudentOption {
  studentId: string;
  name: string;
  level: string;
  phone: string | null;
  guardianPhone: string | null;
  registeredIn: string[];
}

export function StudentSelector({
  groupId,
  activityKey,
  initialIds = [],
}: {
  groupId?: string;
  activityKey: string;
  initialIds?: string[];
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<StudentOption[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set(initialIds));

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const results = await searchStudentsAction({ groupId, activityKey, q: query });
        setResults(results);
      } catch {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [query, groupId, activityKey]);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Search className="size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن طالب بالاسم…"
          className="flex-1"
        />
      </div>
      {results.length > 0 && (
        <div className="max-h-48 overflow-y-auto border border-border rounded-md bg-surface-1 p-2 text-sm">
          {results.map((s) => (
            <div
              key={s.studentId}
              className="flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-accent"
              onClick={() => toggle(s.studentId)}
            >
              <input
                type="checkbox"
                checked={selected.has(s.studentId)}
                onChange={() => toggle(s.studentId)}
                className="shrink-0"
              />
              <span className="flex-1 truncate">{s.name}</span>
              <span className="text-xs text-muted-foreground">{s.level}</span>
              {s.registeredIn.length > 0 && (
                <span className="text-xs text-muted-foreground italic">
                  مسجل في: {s.registeredIn.join("، ")}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
      {selected.size > 0 && (
        <div className="flex flex-wrap gap-2">
          {Array.from(selected).map((id) => {
            const s = results.find((r) => r.studentId === id);
            return (
              <div key={id} className="flex items-center gap-1 rounded-md bg-muted px-2 py-1 text-sm">
                <span>{s?.name || id}</span>
                <button
                  type="button"
                  onClick={() => toggle(id)}
                  className="text-xs text-destructive hover:bg-destructive/10 rounded p-1"
                >
                  ×
                </button>
              </div>
            );
          })}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setSelected(new Set());
              setQuery("");
              setResults([]);
            }}
          >
            إلغاء التحديد
          </Button>
        </div>
      )}
    </div>
  );
}

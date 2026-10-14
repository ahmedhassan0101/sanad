// تاريخ الميلاد: كتابة مباشرة + نافذة اختيار بقوائم سنة/شهر سريعة — يخزن YYYY-MM-DD كنص بلا انزياح منطقة زمنية.
"use client";

import { useState } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { CalendarDays } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { FieldShell } from "./field-shell";

export interface FormDatePickerProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  minAge?: number;
  maxAge?: number;
}

const MONTHS = [
  "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
  "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر",
];

const WEEKDAYS = ["أحد", "إثنين", "ثلا", "أرب", "خمي", "جمع", "سبت"];

const pad = (n: number) => String(n).padStart(2, "0");
const toStr = (y: number, m: number, d: number) => `${y}-${pad(m)}-${pad(d)}`;

function parse(value: string | undefined): { y: number; m: number; d: number } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!match) return null;
  const y = Number(match[1]);
  const m = Number(match[2]);
  const d = Number(match[3]);
  if (m < 1 || m > 12 || d < 1 || d > 31) return null;
  return { y, m, d };
}

function formatAr(value: string | undefined): string {
  const p = parse(value);
  return p ? `${p.d} ${MONTHS[p.m - 1]} ${p.y}` : "";
}

export function FormDatePicker<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
  minAge = 4,
  maxAge = 18,
}: FormDatePickerProps<T>) {
  const thisYear = new Date().getFullYear();
  const minYear = thisYear - maxAge;
  const maxYear = thisYear - minAge;
  const years: number[] = [];
  for (let y = maxYear; y >= minYear; y--) years.push(y);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const current = parse(field.value as string | undefined);
        return (
          <DatePickerBody
            label={label}
            description={description}
            required={required}
            disabled={disabled}
            error={fieldState.error?.message}
            invalid={fieldState.invalid}
            value={field.value as string | undefined}
            current={current}
            years={years}
            onBlur={field.onBlur}
            onChange={(v) => field.onChange(v)}
          />
        );
      }}
    />
  );
}

function DatePickerBody({
  label,
  description,
  required,
  disabled,
  error,
  invalid,
  value,
  current,
  years,
  onBlur,
  onChange,
}: {
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  invalid: boolean;
  value: string | undefined;
  current: { y: number; m: number; d: number } | null;
  years: number[];
  onBlur: () => void;
  onChange: (v: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState<string | null>(null);
  const [view, setView] = useState(() => ({
    y: current?.y ?? years[0]!,
    m: current?.m ?? 1,
  }));
  const daysInMonth = new Date(view.y, view.m, 0).getDate();
  const leadBlank = new Date(view.y, view.m - 1, 1).getDay();

  const commitText = () => {
    if (text === null) return;
    onChange(/^\d{4}-\d{2}-\d{2}$/.test(text) && parse(text) ? text : undefined);
    setText(null);
  };

  return (
    <FieldShell
      label={label}
      required={required}
      description={description}
      error={error}
    >
      <div className="flex gap-2">
        <Input
          value={text ?? value ?? ""}
          disabled={disabled}
          dir="ltr"
          inputMode="numeric"
          placeholder="2016-05-01"
          aria-label={`${label} — كتابة مباشرة بصيغة سنة-شهر-يوم`}
          aria-invalid={invalid}
          onChange={(e) => setText(e.target.value)}
          onBlur={() => {
            commitText();
            onBlur();
          }}
          className="flex-1"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger
            render={
              <Button
                type="button"
                variant="outline"
                size="icon"
                disabled={disabled}
                aria-label="اختيار التاريخ من التقويم"
              />
            }
          >
            <CalendarDays className="size-4" />
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex gap-2">
              <select
                aria-label="السنة"
                className="flex-1 rounded-md border border-input bg-background p-2 text-sm"
                value={view.y}
                onChange={(e) => setView((v) => ({ ...v, y: Number(e.target.value) }))}
              >
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
              <select
                aria-label="الشهر"
                className="flex-1 rounded-md border border-input bg-background p-2 text-sm"
                value={view.m}
                onChange={(e) => setView((v) => ({ ...v, m: Number(e.target.value) }))}
              >
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-2 grid grid-cols-7 gap-1 text-center text-xs text-muted-foreground">
              {WEEKDAYS.map((w) => (
                <span key={w} className="py-1">
                  {w}
                </span>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: leadBlank }, (_, i) => (
                <span key={`b${i}`} />
              ))}
              {Array.from({ length: daysInMonth }, (_, i) => {
                const d = i + 1;
                const selected = current?.y === view.y && current?.m === view.m && current?.d === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      onChange(toStr(view.y, view.m, d));
                      setText(null);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex size-10 items-center justify-center rounded-md text-sm hover:bg-accent",
                      selected && "bg-primary text-primary-foreground hover:bg-primary",
                    )}
                  >
                    {d}
                  </button>
                );
              })}
            </div>
            {value && (
              <p className="mt-2 text-center text-sm font-medium">{formatAr(value)}</p>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </FieldShell>
  );
}

// حقل تاريخ بقوائم سنة/شهر سريعة (للأعمار الصغيرة) — عربي RTL بلا مكتبات.
"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
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

function parse(value: string | undefined): { y: string; m: string; d: string } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  return { y: match?.[1] ?? "", m: match?.[2] ?? "", d: match?.[3] ?? "" };
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
  const years: number[] = [];
  for (let y = thisYear - maxAge; y <= thisYear - minAge; y++) years.push(y);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const { y, m, d } = parse(field.value as string | undefined);
        const emit = (ny: string, nm: string, nd: string) => {
          field.onChange(ny && nm && nd ? `${ny}-${nm}-${nd}` : undefined);
        };
        const cls = "rounded-md border border-input bg-background p-2 text-sm disabled:opacity-50";
        return (
          <FieldShell
            label={label}
            required={required}
            description={description}
            error={fieldState.error?.message}
            htmlFor={`field-${String(name)}-y`}
          >
            <div className="flex gap-2">
              <select
                id={`field-${String(name)}-y`}
                aria-label="السنة"
                className={`${cls} flex-1`}
                value={y}
                disabled={disabled}
                aria-invalid={fieldState.invalid}
                onChange={(e) => emit(e.target.value, m, d)}
                onBlur={field.onBlur}
              >
                <option value="">سنة</option>
                {years.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <select
                aria-label="الشهر"
                className={`${cls} flex-1`}
                value={m ? String(Number(m)) : ""}
                disabled={disabled}
                onChange={(e) => emit(y, e.target.value ? String(e.target.value).padStart(2, "0") : "", d)}
              >
                <option value="">شهر</option>
                {MONTHS.map((month, i) => (
                  <option key={month} value={i + 1}>
                    {month}
                  </option>
                ))}
              </select>
              <select
                aria-label="اليوم"
                className={`${cls} flex-1`}
                value={d ? String(Number(d)) : ""}
                disabled={disabled}
                onChange={(e) => emit(y, m, e.target.value ? String(e.target.value).padStart(2, "0") : "")}
              >
                <option value="">يوم</option>
                {days.map((day) => (
                  <option key={day} value={day}>
                    {day}
                  </option>
                ))}
              </select>
            </div>
          </FieldShell>
        );
      }}
    />
  );
}

// قائمة منسدلة بخيارات ثابتة — سطر واحد في أي فورم.
"use client";

import { useId } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FieldShell } from "./field-shell";

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormSelectProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: SelectOption[];
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormSelect<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  placeholder = "اختر…",
  required,
  disabled,
}: FormSelectProps<T>) {
  const fallbackId = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${String(name)}-${fallbackId}`;
        return (
          <FieldShell
            label={label}
            required={required}
            description={description}
            error={fieldState.error?.message}
            htmlFor={id}
          >
            <Select
              name={field.name}
              value={(field.value as string | undefined) ?? ""}
              onValueChange={field.onChange}
              disabled={disabled}
            >
              <SelectTrigger id={id} aria-invalid={fieldState.invalid}>
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
              <SelectContent>
                {options.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
        );
      }}
    />
  );
}

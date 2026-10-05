// حقل نص طويل (ملاحظات/وصف) — سطر واحد في أي فورم.
"use client";

import { useId } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Textarea } from "@/components/ui/textarea";
import { FieldShell } from "./field-shell";

export interface FormTextareaProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  rows?: number;
}

export function FormTextarea<T extends FieldValues>({
  control,
  name,
  label,
  description,
  placeholder,
  required,
  disabled,
  readOnly,
  rows = 4,
}: FormTextareaProps<T>) {
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
            <Textarea
              id={id}
              placeholder={placeholder}
              disabled={disabled}
              readOnly={readOnly}
              rows={rows}
              aria-invalid={fieldState.invalid}
              value={(field.value as string | undefined) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          </FieldShell>
        );
      }}
    />
  );
}

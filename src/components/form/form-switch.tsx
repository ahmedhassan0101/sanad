// مفتاح تشغيل/إيقاف (نعم/لا) — سطر واحد في أي فورم.
"use client";

import { useId } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Field, FieldContent, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";
import { Switch } from "@/components/ui/switch";

export interface FormSwitchProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormSwitch<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
}: FormSwitchProps<T>) {
  const fallbackId = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${String(name)}-${fallbackId}`;
        return (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            <FieldContent>
              <FieldLabel htmlFor={id}>
                {label}
                {required && (
                  <span aria-hidden="true" className="text-destructive">
                    {" "}
                    *
                  </span>
                )}
              </FieldLabel>
              {description && <FieldDescription>{description}</FieldDescription>}
              {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
            </FieldContent>
            <Switch
              id={id}
              name={field.name}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
            />
          </Field>
        );
      }}
    />
  );
}

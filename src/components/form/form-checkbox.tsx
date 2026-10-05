// صح/خطأ مفرد أو اختيار متعدد — سطر واحد في أي فورم.
"use client";

import { useId } from "react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field";


export interface FormCheckboxProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormCheckbox<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
}: FormCheckboxProps<T>) {
  const fallbackId = useId();
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${String(name)}-${fallbackId}`;
        return (
          <Field orientation="horizontal" data-invalid={fieldState.invalid}>
            <Checkbox
              id={id}
              name={field.name}
              checked={!!field.value}
              onCheckedChange={field.onChange}
              disabled={disabled}
              aria-invalid={fieldState.invalid}
            />
            <div>
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
            </div>
          </Field>
        );
      }}
    />
  );
}

export interface FormCheckboxesProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: { value: string; label: string }[];
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormCheckboxes<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  required,
  disabled,
}: FormCheckboxesProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const selected = (field.value as string[] | undefined) ?? [];
        const toggle = (value: string, checked: boolean) =>
          field.onChange(checked ? [...selected, value] : selected.filter((v) => v !== value));
        return (
          <FieldSet data-invalid={fieldState.invalid}>
            <FieldLegend>
              {label}
              {required && (
                <span aria-hidden="true" className="text-destructive">
                  {" "}
                  *
                </span>
              )}
            </FieldLegend>
            {description && <FieldDescription>{description}</FieldDescription>}
            <FieldGroup data-slot="checkbox-group">
              {options.map((o) => (
                <Field key={o.value} orientation="horizontal" data-invalid={fieldState.invalid}>
                  <Checkbox
                    id={`field-${String(name)}-${o.value}`}
                    name={field.name}
                    checked={selected.includes(o.value)}
                    onCheckedChange={(checked) => toggle(o.value, checked === true)}
                    disabled={disabled}
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldLabel htmlFor={`field-${String(name)}-${o.value}`} className="font-normal">
                    {o.label}
                  </FieldLabel>
                </Field>
              ))}
            </FieldGroup>
            {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
          </FieldSet>
        );
      }}
    />
  );
}

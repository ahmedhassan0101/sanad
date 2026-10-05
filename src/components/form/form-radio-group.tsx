// اختيار واحد من عدة خيارات ظاهرة — سطر واحد في أي فورم.
"use client";

import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLegend,
  FieldLabel,
  FieldSet,
  FieldTitle,
} from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

export interface RadioOption {
  value: string;
  title: string;
  description?: string;
}

export interface FormRadioGroupProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  options: RadioOption[];
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function FormRadioGroup<T extends FieldValues>({
  control,
  name,
  label,
  options,
  description,
  required,
  disabled,
}: FormRadioGroupProps<T>) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => (
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
          <RadioGroup
            name={field.name}
            value={(field.value as string | undefined) ?? ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            {options.map((o) => (
              <FieldLabel key={o.value} htmlFor={`field-${String(name)}-${o.value}`}>
                <Field orientation="horizontal" data-invalid={fieldState.invalid}>
                  <FieldContent>
                    <FieldTitle>{o.title}</FieldTitle>
                    {o.description && <FieldDescription>{o.description}</FieldDescription>}
                  </FieldContent>
                  <RadioGroupItem
                    value={o.value}
                    id={`field-${String(name)}-${o.value}`}
                    aria-invalid={fieldState.invalid}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
          {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
        </FieldSet>
      )}
    />
  );
}

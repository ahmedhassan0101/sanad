// حقل نص/إيميل/باسورد/رقم/هاتف — سطر واحد في أي فورم.
"use client";

import { useId, useState, type ReactNode } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "@/components/ui/input-group";
import { FieldShell } from "./field-shell";

export type TextInputType = "text" | "email" | "password" | "number" | "tel";

export interface FormInputProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  type?: TextInputType;
  description?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  icon?: ReactNode;
  endIcon?: ReactNode;
  autoComplete?: string;
}

export function FormInput<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  description,
  placeholder,
  required,
  disabled,
  readOnly,
  icon,
  endIcon,
  autoComplete,
}: FormInputProps<T>) {
  const fallbackId = useId();
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const withAddon = !!icon || !!endIcon || isPassword;
  const ltr = type === "email" || type === "tel" || type === "number";

  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const id = `field-${String(name)}-${fallbackId}`;
        const error = fieldState.error?.message;
        const common = {
          id,
          placeholder,
          disabled,
          readOnly,
          autoComplete,
          "aria-invalid": fieldState.invalid,
          dir: ltr ? ("ltr" as const) : undefined,
        };
        const controlNode =
          type === "number" ? (
            <Input
              {...common}
              type="number"
              inputMode="decimal"
              value={(field.value as number | undefined) ?? ""}
              onChange={(e) =>
                field.onChange(e.target.value === "" ? undefined : e.target.valueAsNumber)
              }
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          ) : withAddon ? (
            <InputGroup data-invalid={fieldState.invalid}>
              {icon && <InputGroupAddon align="inline-start">{icon}</InputGroupAddon>}
              <InputGroupInput
                {...common}
                type={isPassword && showPassword ? "text" : type}
                value={(field.value as string | undefined) ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                name={field.name}
                ref={field.ref}
              />
              <InputGroupAddon align="inline-end">
                {endIcon}
                {isPassword && (
                  <InputGroupButton
                    type="button"
                    variant="ghost"
                    size="icon-xs"
                    onClick={() => setShowPassword((s) => !s)}
                    aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </InputGroupButton>
                )}
              </InputGroupAddon>
            </InputGroup>
          ) : (
            <Input
              {...common}
              type={type}
              value={(field.value as string | undefined) ?? ""}
              onChange={field.onChange}
              onBlur={field.onBlur}
              name={field.name}
              ref={field.ref}
            />
          );
        return (
          <FieldShell
            label={label}
            required={required}
            description={description}
            error={error}
            htmlFor={id}
          >
            {controlNode}
          </FieldShell>
        );
      }}
    />
  );
}

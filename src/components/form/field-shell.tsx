// غلاف موحد للحقول: عنوان + وصف + خطأ — يُكتب مرة واحدة ويُستخدم في كل حقل.
import type { ReactNode } from "react";
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field";

export interface ShellProps {
  label: string;
  required?: boolean;
  description?: string;
  error?: string;
  htmlFor?: string;
  children: ReactNode;
}

export function FieldShell({ label, required, description, error, htmlFor, children }: ShellProps) {
  const invalid = !!error;
  return (
    <Field data-invalid={invalid}>
      <FieldLabel htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden="true" className="text-destructive">
            {" "}
            *
          </span>
        )}
      </FieldLabel>
      {children}
      {description && <FieldDescription>{description}</FieldDescription>}
      {invalid && <FieldError errors={[{ message: error }]} />}
    </Field>
  );
}

export function FormAlert({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div role="alert">
      <FieldError errors={[{ message }]} />
    </div>
  );
}

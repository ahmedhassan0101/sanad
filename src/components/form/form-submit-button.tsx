// زر الإرسال: يعرض التحميل ويُعطّل نفسه أثناء الإرسال (ويُجمّد حتى يتغير شيء).
"use client";

import type { ReactNode } from "react";
import type { FieldValues, UseFormReturn } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";

export interface FormSubmitButtonProps<T extends FieldValues> {
  form: UseFormReturn<T>;
  children: ReactNode;
  requireDirty?: boolean;
}

export function FormSubmitButton<T extends FieldValues>({
  form,
  children,
  requireDirty,
}: FormSubmitButtonProps<T>) {
  const { isSubmitting, isDirty } = form.formState;
  return (
    <Button type="submit" disabled={isSubmitting || (requireDirty && !isDirty)}>
      {isSubmitting && <Spinner />}
      {isSubmitting ? "جارٍ الحفظ…" : children}
    </Button>
  );
}

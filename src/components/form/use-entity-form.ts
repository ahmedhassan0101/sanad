// خطاف الفورم الواحد للإنشاء والتعديل: نفس المكوّن، والفرق فقط defaultValues.
"use client";

import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import type { z } from "zod";

export function useEntityForm<T extends FieldValues>({
  schema,
  defaultValues,
  values,
}: {
  schema: z.ZodType<T>;
  defaultValues: DefaultValues<T>;
  // سجل موجود يُحمّل لاحقًا (وضع التعديل): يُعاد ضبط الفورم عليه عند وصوله.
  values?: T | null;
}) {
  const form = useForm<T>({ resolver: zodResolver(schema), defaultValues, mode: "onTouched" });
  useEffect(() => {
    if (values) form.reset(values);
  }, [form, values]);
  return form;
}

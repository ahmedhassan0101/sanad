// "use client";

// import { useEffect } from "react";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
// import type { z } from "zod";

// export function useEntityForm<T extends FieldValues>({
//   schema,
//   defaultValues,
//   values,
// }: {
//   schema: z.ZodType<T>;
//   // Props must be serializable for components in the "use client" entry file, "schema" is invalid.
//   defaultValues: DefaultValues<T>;
//   values?: T | null;
// }) {
//   const form = useForm<T>({
//     resolver: zodResolver(schema),
//     defaultValues,
//     mode: "onBlur",
//   });
//   useEffect(() => {
//     if (values) form.reset(values);
//   }, [form, values]);
//   return form;
// }

"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type DefaultValues, type FieldValues } from "react-hook-form";
import type { z } from "zod";

interface UseEntityFormProps<T extends FieldValues> {
  schema: z.ZodSchema<T>;
  defaultValues?: DefaultValues<T>;
  values?: T | null;
}

export function useEntityForm<T extends FieldValues>({
  schema,
  defaultValues,
  values,
}: UseEntityFormProps<T>) {
  return useForm<T>({
    resolver: zodResolver(schema),
    defaultValues,
    values: values ?? undefined, // يحل محل useEffect لإعادة ضبط القيم تلقائياً
    mode: "onTouched",
    reValidateMode: "onChange",
  });
}

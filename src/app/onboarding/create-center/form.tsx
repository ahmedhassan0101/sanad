// فورم إنشاء مركز: بيانات فقط — إرسال واحد.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FormAlert,
  FormInput,
  FormSubmitButton,
  useEntityForm,
} from "@/components/form";
import { createCenterSchema } from "@/validators/forms";
import { createCenterAction } from "./actions";

export function CreateCenterForm() {
  const form = useEntityForm({
    schema: createCenterSchema,
    defaultValues: { name: "", contactPhone: "", addressText: undefined },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        const res = await createCenterAction(values);
        if (!res.ok) {
          setServerError(res.message);
          toast.error(res.message);
        }
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <FormInput control={form.control} name="name" label="اسم المركز" type="text" required placeholder="مثال: مركز النور" />
      <FormInput control={form.control} name="contactPhone" label="رقم التواصل" type="tel" required placeholder="01xxxxxxxxx" />
      <FormInput control={form.control} name="addressText" label="العنوان (اختياري)" type="text" />
      <FormSubmitButton form={form}>إنشاء المركز</FormSubmitButton>
    </form>
  );
}

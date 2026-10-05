// فورم إنشاء مركز: بيانات + برامج (checkboxes) + مخصص — إرسال واحد.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FormAlert,
  FormCheckboxes,
  FormInput,
  FormSubmitButton,
  useEntityForm,
} from "@/components/form";
import { PROGRAM_CATALOG } from "@/lib/programs";
import { createCenterSchema } from "@/validators/forms";
import { createCenterAction } from "./actions";

export function CreateCenterForm() {
  const form = useEntityForm({
    schema: createCenterSchema,
    defaultValues: { name: "", contactPhone: "", addressText: undefined, programs: [], customProgram: undefined },
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
      <FormCheckboxes
        control={form.control}
        name="programs"
        label="البرامج"
        required
        description="اختر برنامجًا واحدًا على الأقل"
        options={PROGRAM_CATALOG.map((p) => ({ value: p.key, label: p.name }))}
      />
      <FormInput control={form.control} name="customProgram" label="برنامج باسم مخصص (اختياري)" type="text" />
      <FormSubmitButton form={form}>إنشاء المركز</FormSubmitButton>
    </form>
  );
}

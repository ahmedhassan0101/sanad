// فورم كلمة المرور الجديدة: الإيميل والتوكن مخفيان في الحقول.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormAlert, FormInput, FormSubmitButton, useEntityForm } from "@/components/form";
import { resetSchema } from "@/validators/forms";
import { resetAction } from "./actions";

export function ResetForm({ email, token }: { email: string; token: string }) {
  const form = useEntityForm({ schema: resetSchema, defaultValues: { password: "" } });
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        const res = await resetAction(email, token, values);
        if (!res.ok) {
          setServerError(res.message);
          toast.error(res.message);
        }
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <FormInput control={form.control} name="password" label="كلمة المرور الجديدة" type="password" required autoComplete="new-password" />
      <FormSubmitButton form={form}>حفظ</FormSubmitButton>
    </form>
  );
}

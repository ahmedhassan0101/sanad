// فورم طلب الاستعادة: يعرض نجاحًا دائمًا (لا يكشف وجود الحساب).
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormAlert, FormInput, FormSubmitButton, useEntityForm } from "@/components/form";
import { forgotSchema } from "@/validators/forms";
import { forgotAction } from "./actions";

export function ForgotForm() {
  const form = useEntityForm({ schema: forgotSchema, defaultValues: { email: "" } });
  const [serverError, setServerError] = useState<string | null>(null);
  const [sent, setSent] = useState<string | null>(null);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        const res = await forgotAction(values);
        if (!res.ok) {
          setServerError(res.message);
          toast.error(res.message);
        } else {
          setSent(res.message);
          toast.success(res.message);
        }
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      {sent && <p className="text-sm text-muted-foreground">{sent}</p>}
      <FormInput control={form.control} name="email" label="البريد الإلكتروني" type="email" required autoComplete="email" />
      <FormSubmitButton form={form}>إرسال الرابط</FormSubmitButton>
    </form>
  );
}

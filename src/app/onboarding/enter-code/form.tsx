// فورم كود الدعوة: حقل واحد + خطأ واضح عند الفشل.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormAlert, FormInput, FormSubmitButton, useEntityForm } from "@/components/form";
import { enterCodeSchema } from "@/validators/forms";
import { enterCodeAction } from "./actions";

export function EnterCodeForm() {
  const form = useEntityForm({ schema: enterCodeSchema, defaultValues: { code: "" } });
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        const res = await enterCodeAction(values);
        if (!res.ok) {
          setServerError(res.message);
          toast.error(res.message);
        }
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <FormInput control={form.control} name="code" label="الكود" type="text" required autoComplete="off" placeholder="مثال: K7M2P9QA" />
      <FormSubmitButton form={form}>انضمام</FormSubmitButton>
    </form>
  );
}

// فورم الدخول: تحقق فوري + زر تحميل + خطأ واضح عند الفشل.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  FormAlert,
  FormInput,
  FormSubmitButton,
  useEntityForm,
} from "@/components/form";
import { loginSchema } from "@/validators/forms";
import { loginAction } from "./actions";

export function LoginForm() {
  const form = useEntityForm({
    schema: loginSchema,
    defaultValues: { email: "", password: "" },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        const res = await loginAction(values);
        if (!res.ok) {
          setServerError(res.message);
          toast.error(res.message);
        }
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <FormInput
        control={form.control}
        name="email"
        label="البريد الإلكتروني"
        type="email"
        required
        autoComplete="email"
        placeholder="name@example.com"
      />
      <FormInput
        control={form.control}
        name="password"
        label="كلمة المرور"
        type="password"
        required
        autoComplete="current-password"
      />
      <FormSubmitButton form={form}>دخول</FormSubmitButton>
    </form>
  );
}

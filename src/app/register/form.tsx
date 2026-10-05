// فورم إنشاء حساب: اسم + إيميل + باسورد مع إظهار/إخفاء.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { FormAlert, FormInput, FormSubmitButton, useEntityForm } from "@/components/form";
import { registerSchema } from "@/validators/forms";
import { registerAction } from "./actions";

export function RegisterForm() {
  const form = useEntityForm({
    schema: registerSchema,
    defaultValues: { name: "", email: "", password: "" },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        const res = await registerAction(values);
        if (!res.ok) {
          setServerError(res.message);
          toast.error(res.message);
        }
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <FormInput control={form.control} name="name" label="الاسم" type="text" required autoComplete="name" placeholder="اسمك الكريم" />
      <FormInput control={form.control} name="email" label="البريد الإلكتروني" type="email" required autoComplete="email" placeholder="name@example.com" />
      <FormInput control={form.control} name="password" label="كلمة المرور" type="password" required autoComplete="new-password" description="8 أحرف على الأقل" />
      <FormSubmitButton form={form}>إنشاء الحساب</FormSubmitButton>
    </form>
  );
}

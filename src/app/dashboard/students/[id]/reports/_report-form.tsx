// فورم التقرير الواحد للإنشاء والتعديل — الفرق فقط القيم الابتدائية.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  FormAlert,
  FormRadioGroup,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
  QuranPositionField,
  useEntityForm,
} from "@/components/form";
import { PROGRESS_TRENDS, TAJWEED_RATINGS } from "@/constants";
import { todayKeyCairo } from "@/lib/progress";
import {
  createReportSchema,
  type CreateReportInput,
} from "@/validators/reports";

export function ReportForm({
  studentId,
  defaultValues,
  submitLabel,
  submit,
}: {
  studentId: string;
  defaultValues: Partial<CreateReportInput>;
  submitLabel: string;
  submit: (
    values: CreateReportInput,
  ) => Promise<{ ok: boolean; message: string }>;
}) {
  const form = useEntityForm({
    schema: createReportSchema,
    defaultValues: {
      hifzPosition: undefined,
      revisionPosition: undefined,
      tajweedRating: "good",
      trend: "stable",
      notes: undefined,
      ...defaultValues,
    },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <form
      onSubmit={form.handleSubmit(async (values) => {
        setServerError(null);
        const res = await submit(values);
        if (!res.ok) {
          setServerError(res.message);
          toast.error(res.message);
          return;
        }
        router.push(`/dashboard/students/${studentId}?saved=1`);
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      <p className="text-sm text-muted-foreground">
        تاريخ التقرير: اليوم ({todayKeyCairo()})
      </p>
      <QuranPositionField
        control={form.control}
        name="hifzPosition"
        label="موضع الحفظ"
        required
      />
      <QuranPositionField
        control={form.control}
        name="revisionPosition"
        label="موضع المراجعة (اختياري)"
      />
      <FormSelect
        control={form.control}
        name="tajweedRating"
        label="تقييم التجويد"
        required
        options={TAJWEED_RATINGS.options}
      />
      <FormRadioGroup
        control={form.control}
        name="trend"
        label="اتجاه التقدم"
        required
        options={PROGRESS_TRENDS.options.map((o) => ({
          value: o.value,
          title: o.label,
        }))}
      />
      <FormTextarea
        control={form.control}
        name="notes"
        label="الملاحظات (اختياري)"
        rows={3}
      />
      <FormSubmitButton form={form}>{submitLabel}</FormSubmitButton>
    </form>
  );
}

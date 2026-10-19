// فورم إنشاء/تعديل مجموعة — مكون عميل يتعامل مع إرسال الفورم والتنقل.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { toast } from "sonner";
import {
  FormAlert,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
  useEntityForm,
} from "@/components/form";
import { createGroupAction } from "./actions";
import { ACTIVITIES_CATALOG } from "@/lib/programs";

const ALL = "all";

const createGroupSchema = z.object({
  branchId: z.string().optional(),
  activityKey: z.string().min(1, "اختر النشاط"),
  name: z.string().trim().min(2, "اسم المجموعة مطلوب").max(80, "اسم المجموعة طويل جدًا"),
  scheduleText: z.string().trim().max(100, "الوقت طويل جدًا").optional().or(z.literal("")),
  teacherId: z.string().optional().or(z.literal("")),
  notes: z.string().trim().max(500, "الملاحظات طويلة جدًا").optional().or(z.literal("")),
});

export function CreateGroupForm({
  activity,
  branches,
  showBranch,
  teachers,
  isEdit = false,
  onSubmit,
}: {
  activity: string;
  branches: { id: string; name: string }[];
  showBranch: boolean;
  teachers: { id: string; name: string }[];
  isEdit?: boolean;
  onSubmit?: (values: {
    activityKey: string;
    name: string;
    scheduleText: string;
    teacherId: string;
    notes: string;
  }) => Promise<{ ok: boolean; message: string; groupId?: string }>;
}) {
  const router = useRouter();
  const form = useEntityForm({
    schema: createGroupSchema,
    defaultValues: {
      branchId: showBranch ? undefined : branches[0]?.id,
      activityKey: activity === ALL ? "" : activity,
      name: "",
      scheduleText: "",
      teacherId: "",
      notes: "",
    },
  });
  const [serverError, setServerError] = useState<string | null>(null);

  return (
    <form
      onSubmit={form.handleSubmit(async (values: z.infer<typeof createGroupSchema>) => {
        setServerError(null);
        try {
          if (onSubmit) {
            const res = await onSubmit({
              activityKey: String(values.activityKey),
              name: String(values.name),
              scheduleText: String(values.scheduleText),
              teacherId: String(values.teacherId),
              notes: String(values.notes),
            });
            if (!res.ok) {
              setServerError(res.message);
              toast.error(res.message);
              return;
            }
            toast.success(isEdit ? "تم الحفظ" : "تمت إضافة المجموعة");
            if (res.groupId) router.push(`/dashboard/groups/${res.groupId}`);
          } else {
            const res = await createGroupAction(values);
            if (!res.ok) {
              setServerError(res.message ?? "تعذر إضافة المجموعة");
              toast.error(res.message ?? "تعذر إضافة المجموعة");
              return;
            }
            toast.success("تمت إضافة المجموعة");
            router.push(`/dashboard/groups/${res.groupId}`);
          }
        } catch (e) {
          const msg = e instanceof Error ? e.message : "تعذر تنفيذ العملية";
          setServerError(msg);
          toast.error(msg);
        }
      })}
      noValidate
      className="flex flex-col gap-4"
    >
      <FormAlert message={serverError} />
      {showBranch && !isEdit && (
        <FormSelect
          control={form.control}
          name="branchId"
          label="الفرع"
          required
          options={branches.map((b) => ({ value: b.id, label: b.name }))}
        />
      )}
      {!showBranch && !isEdit && (
        <input type="hidden" name="branchId" value={branches[0]?.id ?? ""} />
      )}
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium">النشاط</label>
        <FormSelect
          control={form.control}
          name="activityKey"
          label="النشاط"
          required
          placeholder="اختر النشاط…"
          options={ACTIVITIES_CATALOG.map((a) => ({ value: a.key, label: a.name }))}
          disabled={isEdit}
        />
      </div>
      <FormInput
        control={form.control}
        name="name"
        label="اسم المجموعة"
        required
        placeholder="مثال: حلقة الفجر"
      />
      <FormSelect
        control={form.control}
        name="teacherId"
        label="المعلم المشرف (اختياري)"
        placeholder="اختر معلمًا…"
        options={teachers.map((t) => ({ value: t.id, label: t.name }))}
      />
      <FormInput
        control={form.control}
        name="scheduleText"
        label="الوقت النصي (مثال: الأحد بعد المغرب)"
        placeholder="الأحد بعد المغرب"
        description="نص حر حتى 100 حرف"
      />
      <FormTextarea
        control={form.control}
        name="notes"
        label="ملاحظات (اختياري)"
        rows={2}
      />
      <FormSubmitButton form={form}>
        {isEdit ? "تعديل المجموعة" : "إنشاء المجموعة"}
      </FormSubmitButton>
    </form>
  );
}

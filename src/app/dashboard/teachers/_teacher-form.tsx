// src\app\dashboard\teachers\_teacher-form.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  FormAlert,
  FormImageUpload,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
  useEntityForm,
} from "@/components/form";
import { cleanPhone } from "@/lib/students";
import {
  teacherFormSchema,
  type TeacherFormInput,
} from "@/validators/teachers";
import { uploadStudentImageAction } from "../students/actions";

export interface TeacherSubmitResult {
  ok: boolean;
  message: string;
  code?: string;
  duplicate?: { id: string; name: string };
  id?: string;
}

const EMPTY: TeacherFormInput = {
  name: "",
  phone: undefined,
  notes: undefined,
  image: undefined,
  branchId: undefined,
  confirmDuplicate: undefined,
};

export function TeacherForm({
  defaultValues,
  branches,
  showBranch,
  submitLabel,
  imageEnabled,
  submitAction,
}: {
  defaultValues: Partial<TeacherFormInput>;
  branches: { id: string; name: string }[];
  showBranch: boolean;
  submitLabel: string;
  imageEnabled: boolean;
  submitAction: (values: TeacherFormInput) => Promise<TeacherSubmitResult>;
}) {
  const form = useEntityForm({
    schema: teacherFormSchema,
    defaultValues: { ...EMPTY, ...defaultValues },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [dup, setDup] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();

  const isSubmitting = form.formState.isSubmitting;

  // Both regular submission and duplicate confirmation use this handler.
  const send = async (values: TeacherFormInput) => {
    setServerError(null);
    if (values.confirmDuplicate === true) setDup(null);
    const res = await submitAction({
      ...values,
      phone: values.phone ? cleanPhone(values.phone) : values.phone,
    });
    if (!res.ok) {
      if (res.code === "DUPLICATE_WARNING" && res.duplicate) {
        setDup(res.duplicate);
        return;
      }
      setServerError(res.message);
      toast.error(res.message);
      return;
    }
    if (res.id) router.push(`/dashboard/teachers/${res.id}`);
  };

  return (
    <>
      <form
        id="teacher-form"
        onSubmit={form.handleSubmit(send)}
        noValidate
        className="flex flex-col gap-4"
      >
        <fieldset
          disabled={isSubmitting}
          className="m-0 flex flex-col gap-4 border-0 p-0"
        >
          <FormAlert message={serverError} />
          {imageEnabled && (
            <FormImageUpload
              control={form.control}
              name="image"
              label="الصورة (اختياري)"
              description="jpeg أو png أو webp حتى 2MB"
              upload={async (file: File) => {
                const fd = new FormData();
                fd.append("file", file);
                return uploadStudentImageAction(fd);
              }}
            />
          )}
          {showBranch && (
            <FormSelect
              control={form.control}
              name="branchId"
              label="الفرع"
              required
              options={branches.map((b) => ({ value: b.id, label: b.name }))}
            />
          )}
          <FormInput
            control={form.control}
            name="name"
            label="الاسم"
            type="text"
            required
            placeholder="اسم المعلم"
          />
          <FormInput
            control={form.control}
            name="phone"
            label="الهاتف (اختياري)"
            type="tel"
            required
          />
          <FormTextarea
            control={form.control}
            name="notes"
            label="الملاحظات (اختياري)"
            rows={3}
          />
          <FormSubmitButton form={form}>{submitLabel}</FormSubmitButton>
        </fieldset>
      </form>
      <Dialog open={!!dup} onOpenChange={(o) => !o && setDup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>معلم مشابه موجود</DialogTitle>
            <DialogDescription>
              يوجد «{dup?.name}» في نفس الفرع. هل تريد الحفظ على أي حال؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              disabled={isSubmitting}
              onClick={() => setDup(null)}
            >
              تراجع
            </Button>
            <Button
              type="submit"
              // onClick={() => {
              //   const values = { ...form.getValues(), confirmDuplicate: true };
              //   setDup(null);
              //   void send(values);
              // }}
              onClick={() => {
                form.setValue("confirmDuplicate", true, {
                  shouldValidate: false,
                });
              }}
            >
              {isSubmitting ? "جارٍ الحفظ..." : "حفظ على أي حال"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

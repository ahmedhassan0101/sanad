// فورم الطالب الواحد للإنشاء والتعديل — الفرق فقط defaultValues وحقل الحفظ.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useFieldArray } from "react-hook-form";
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
  FormDatePicker,
  FormImageUpload,
  FormInput,
  FormSelect,
  FormSubmitButton,
  FormTextarea,
  QuranPositionField,
  useEntityForm,
} from "@/components/form";
import { uploadStudentImageAction } from "./actions";
import { GENDERS, GUARDIAN_RELATIONS, LEVELS } from "@/constants/students";
import { cleanPhone } from "@/lib/students";
import {
  studentFormSchema,
  type StudentFormInput,
} from "@/validators/students";

export interface StudentSubmitResult {
  ok: boolean;
  message: string;
  code?: string;
  duplicate?: { id: string; name: string };
  id?: string;
}

const EMPTY: StudentFormInput = {
  name: "",
  gender: "male",
  level: "beginner",
  birthDate: undefined,
  phone: undefined,
  address: undefined,
  notes: undefined,
  guardians: [{ relation: "father", phone: "" }] as StudentFormInput["guardians"],
  image: undefined,
  branchId: undefined,
  hifz: undefined,
  hifzPosition: undefined,
  confirmDuplicate: undefined,
};

export function StudentForm({
  defaultValues,
  branches,
  showBranch,
  hifzMode,
  submitLabel,
  imageEnabled,
  submit,
}: {
  defaultValues: Partial<StudentFormInput>;
  branches: { id: string; name: string }[];
  showBranch: boolean;
  hifzMode: "create" | "edit";
  submitLabel: string;
  imageEnabled: boolean;
  submit: (values: StudentFormInput) => Promise<StudentSubmitResult>;
}) {
  const form = useEntityForm({
    schema: studentFormSchema,
    defaultValues: { ...EMPTY, ...defaultValues },
  });
  const [serverError, setServerError] = useState<string | null>(null);
  const [dup, setDup] = useState<{ id: string; name: string } | null>(null);
  const router = useRouter();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "guardians",
  });

  const send = async (values: StudentFormInput) => {
    setServerError(null);
    // الصف الفارغ كليًا يُحذف قبل الإرسال (المخطط يحذفه أيضًا قبل التحقق).
    const guardians = (values.guardians ?? []).filter(
      (g) => g.phone.trim() !== "",
    );
    const res = await submit({
      ...values,
      phone: values.phone ? cleanPhone(values.phone) : values.phone,
      guardians: guardians.map((g) => ({ ...g, phone: cleanPhone(g.phone) })),
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
    if (res.id) router.push(`/dashboard/students/${res.id}`);
  };

  return (
    <>
      <form
        onSubmit={form.handleSubmit(send)}
        noValidate
        className="flex flex-col gap-4"
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
          placeholder="الاسم رباعيًا"
        />
        <div className="grid grid-cols-2 gap-2">
          <FormSelect
            control={form.control}
            name="gender"
            label="النوع"
            required
            options={GENDERS.options}
          />
          <FormSelect
            control={form.control}
            name="level"
            label="المستوى"
            required
            options={LEVELS.options}
          />
        </div>
        <FormDatePicker
          control={form.control}
          name="birthDate"
          label="تاريخ الميلاد"
        />
        <FormInput
          control={form.control}
          name="phone"
          label="هاتف الطالب (اختياري)"
          type="tel"
        />
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium">أولياء الأمور (حتى 4)</p>
          {fields.map((f, i) => (
            <div key={f.id} className="flex items-end gap-2">
              <div className="flex-1">
                <FormSelect
                  control={form.control}
                  name={`guardians.${i}.relation` as const}
                  label="الصلة"
                  options={GUARDIAN_RELATIONS.options}
                />
              </div>
              <div className="flex-1">
                <FormInput
                  control={form.control}
                  name={`guardians.${i}.phone` as const}
                  label="الهاتف"
                  type="tel"
                />
              </div>
              <Button type="button" variant="outline" onClick={() => remove(i)}>
                حذف
              </Button>
            </div>
          ))}
          {fields.length < 4 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => append({ relation: "father", phone: "" })}
            >
              إضافة ولي أمر آخر
            </Button>
          )}
        </div>
        <FormInput
          control={form.control}
          name="address"
          label="العنوان (اختياري)"
          type="text"
        />
        <FormTextarea
          control={form.control}
          name="notes"
          label="الملاحظات (اختياري)"
          rows={3}
        />
        {hifzMode === "create" ? (
          <QuranPositionField
            control={form.control}
            name="hifz"
            label="موضع الحفظ الحالي (اختياري)"
            description="يُسجَّل كبداية وحالي معًا"
          />
        ) : (
          <QuranPositionField
            control={form.control}
            name="hifzPosition"
            label="موضع الحفظ الحالي (اختياري)"
            description="التعديل هنا لا يغيّر البداية"
          />
        )}
        <FormSubmitButton form={form}>{submitLabel}</FormSubmitButton>
      </form>
      <Dialog open={!!dup} onOpenChange={(o) => !o && setDup(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>طالب مشابه موجود</DialogTitle>
            <DialogDescription>
              يوجد «{dup?.name}» في نفس الفرع. هل تريد الحفظ على أي حال؟
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setDup(null)}
            >
              تراجع
            </Button>
            <Button
              type="button"
              onClick={() => {
                const values = { ...form.getValues(), confirmDuplicate: true };
                setDup(null);
                void send(values);
              }}
            >
              حفظ على أي حال
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// رفع صورة بمعاينة فورية: يرفع عند الاختيار عبر دالة تُمرَّر من الصفحة.
"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Controller, type Control, type FieldValues, type Path } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { FieldShell } from "./field-shell";

export interface UploadedImage {
  url: string;
  publicId: string;
}

export interface FormImageUploadProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  disabled?: boolean;
  upload: (file: File) => Promise<
    { ok: true; url: string; publicId: string } | { ok: false; message: string }
  >;
}

const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];

export function FormImageUpload<T extends FieldValues>({
  control,
  name,
  label,
  description,
  disabled,
  upload,
}: FormImageUploadProps<T>) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = field.value as UploadedImage | undefined;
        const pick = async (file: File | undefined) => {
          if (!file) return;
          if (!ACCEPTED.includes(file.type)) {
            toast.error("نوع الصورة يجب أن يكون jpeg أو png أو webp");
            return;
          }
          if (file.size > 2 * 1024 * 1024) {
            toast.error("حجم الصورة 2MB كحد أقصى");
            return;
          }
          setBusy(true);
          const res = await upload(file);
          setBusy(false);
          if (!res.ok) {
            toast.error(res.message);
            return;
          }
          field.onChange({ url: res.url, publicId: res.publicId });
        };
        return (
          <FieldShell
            label={label}
            description={description}
            error={fieldState.error?.message}
          >
            {value?.url ? (
              <div className="flex items-center gap-3">
                <img src={value.url} alt="" className="size-16 rounded-full object-cover" />
                <Button type="button" variant="outline" disabled={disabled} onClick={() => field.onChange(undefined)}>
                  إزالة
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <input
                  ref={inputRef}
                  type="file"
                  accept={ACCEPTED.join(",")}
                  disabled={disabled || busy}
                  className="text-sm"
                  onChange={(e) => {
                    void pick(e.target.files?.[0]);
                    e.target.value = "";
                  }}
                />
                {busy && <span className="text-sm text-muted-foreground">جارٍ الرفع…</span>}
              </div>
            )}
          </FieldShell>
        );
      }}
    />
  );
}

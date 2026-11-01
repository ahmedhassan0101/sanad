// موضع في المصحف: سورة بقائمة بحث + آية برقم بحد أقصى حسب السورة.
"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
} from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { QURAN_SURAHS, getSurah } from "@/constants";
import { FieldShell } from "./field-shell";

export interface QuranPositionValue {
  surah: number;
  ayah: number;
}

export interface QuranPositionFieldProps<T extends FieldValues> {
  control: Control<T>;
  name: Path<T>;
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
}

export function QuranPositionField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  required,
  disabled,
}: QuranPositionFieldProps<T>) {
  const [open, setOpen] = useState(false);
  return (
    <Controller
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const value = field.value as QuranPositionValue | undefined;
        const surah = value ? getSurah(value.surah) : undefined;
        const set = (next: QuranPositionValue | undefined) =>
          field.onChange(next);
        return (
          <FieldShell
            label={label}
            required={required}
            description={description}
            error={fieldState.error?.message}
          >
            <div className="flex flex-col gap-2">
              <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger
                  render={
                    <Button
                      type="button"
                      variant="outline"
                      disabled={disabled}
                      aria-invalid={fieldState.invalid}
                      className="justify-between"
                    />
                  }
                >
                  {surah ? `سورة ${surah.name}` : "اختر السورة…"}
                  <ChevronsUpDown className="size-4 opacity-50" />
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Command>
                    <CommandInput placeholder="ابحث باسم السورة…" />
                    <CommandList>
                      <CommandEmpty>لا نتائج</CommandEmpty>
                      <CommandGroup>
                        {QURAN_SURAHS.map((s) => (
                          <CommandItem
                            key={s.number}
                            value={`${s.name} ${s.number}`}
                            onSelect={() => {
                              set({ surah: s.number, ayah: value?.ayah ?? 1 });
                              setOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                "size-4",
                                value?.surah === s.number
                                  ? "opacity-100"
                                  : "opacity-0",
                              )}
                            />
                            {s.number} - {s.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={1}
                  max={surah?.ayahs}
                  inputMode="numeric"
                  placeholder="الآية"
                  disabled={disabled || !surah}
                  aria-label="الآية"
                  aria-invalid={fieldState.invalid}
                  value={value?.ayah ?? ""}
                  onChange={(e) =>
                    set(
                      surah
                        ? { surah: surah.number, ayah: e.target.valueAsNumber }
                        : undefined,
                    )
                  }
                  onBlur={field.onBlur}
                />
                <span className="whitespace-nowrap text-xs text-muted-foreground">
                  {surah
                    ? `عدد آيات السورة: ${surah.ayahs}`
                    : "اختر السورة أولًا"}
                </span>
              </div>
            </div>
          </FieldShell>
        );
      }}
    />
  );
}

// أزرار التفاصيل التي تحتاج تأكيدًا: حذف نهائي (بكتابة الاسم) وتجديد الكود.
"use client";

import { useState } from "react";
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
import { Input } from "@/components/ui/input";
import { deleteStudentAction, regenerateCodeAction } from "../actions";

export function DeleteStudentButton({ id, name }: { id: string; name: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="destructive" onClick={() => setOpen(true)}>
        حذف نهائي
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف نهائي لا رجعة فيه</DialogTitle>
            <DialogDescription>اكتب اسم الطالب «{name}» للتأكيد</DialogDescription>
          </DialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="اسم الطالب" />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              تراجع
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy || typed.trim() !== name.trim()}
              onClick={async () => {
                setBusy(true);
                const res = await deleteStudentAction(id);
                if (!res.ok) {
                  setBusy(false);
                  toast.error(res.message);
                }
              }}
            >
              تأكيد الحذف
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function RegenerateCodeButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        تجديد الكود
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>تجديد كود ولي الأمر؟</DialogTitle>
            <DialogDescription>الكود القديم سيتوقف فورًا عن العمل.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              تراجع
            </Button>
            <Button
              type="button"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                const res = await regenerateCodeAction(id);
                if (!res.ok) {
                  setBusy(false);
                  toast.error(res.message);
                } else {
                  setOpen(false);
                  toast.success("تم تجديد الكود");
                }
              }}
            >
              تجديد
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export function CopyTextButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setDone(true);
        setTimeout(() => setDone(false), 2000);
      }}
    >
      {done ? "تم النسخ" : label}
    </Button>
  );
}

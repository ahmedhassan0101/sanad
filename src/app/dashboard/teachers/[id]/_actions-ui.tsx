// زر الحذف النهائي للمعلم بتأكيد كتابة الاسم.
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
import { deleteTeacherAction } from "../actions";

export function DeleteTeacherButton({ id, name }: { id: string; name: string }) {
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
            <DialogDescription>اكتب اسم المعلم «{name}» للتأكيد</DialogDescription>
          </DialogHeader>
          <Input value={typed} onChange={(e) => setTyped(e.target.value)} placeholder="اسم المعلم" />
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
                const res = await deleteTeacherAction(id);
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

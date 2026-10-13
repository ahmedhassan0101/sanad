// زر حذف تقرير بحوار تأكيد.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { deleteReportAction } from "./actions";

export function DeleteReportButton({ studentId, reportId }: { studentId: string; reportId: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  return (
    <>
      <Button type="button" variant="outline" size="sm" onClick={() => setOpen(true)}>
        حذف
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>حذف التقرير؟</DialogTitle>
            <DialogDescription>سيعود موضع الطالب إلى التقرير السابق تلقائيًا.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              تراجع
            </Button>
            <Button
              type="button"
              variant="destructive"
              disabled={busy}
              onClick={async () => {
                setBusy(true);
                await deleteReportAction(studentId, reportId);
                setBusy(false);
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

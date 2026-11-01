// زر إعادة الإرسال مع حد المعدل وتنبيه.
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { resendAction } from "./actions";

export function ResendButton() {
  const [busy, setBusy] = useState(false);
  return (
    <Button
      variant="outline"
      className="w-full"
      disabled={busy}
      onClick={async () => {
        setBusy(true);
        const res = await resendAction();
        setBusy(false);
        if (res.ok) toast.success("أُرسل الرابط إلى بريدك");
        else toast.error(res.message);
      }}
    >
      إعادة إرسال الرابط
    </Button>
  );
}


    // <Button
    //   variant="outline"
    //   className="w-full"
    //   disabled={busy}
    //   onClick={async () => {
    //     if (busy) return;
    //     setBusy(true);
    //     try {
    //       const res = await resendAction();

    //       if (res.ok) {
    //         toast.success("أُرسل الرابط إلى بريدك");
    //       } else {
    //         toast.error(res.message);
    //       }
    //     } catch {
    //       toast.error("تعذر الإرسال — حاول مجددًا");
    //     } finally {
    //       setBusy(false);
    //     }
    //   }}
    // >
    //   إعادة إرسال الرابط
    // </Button>
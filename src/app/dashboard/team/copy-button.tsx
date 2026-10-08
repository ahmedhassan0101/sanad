// زر نسخ الكود + رابط واتساب جاهز.
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CopyInvite({ code }: { code: string }) {
  const [done, setDone] = useState(false);
  const text = `انضم إلى مركزنا بهذا الكود: ${code}`;
  return (
    <div className="flex gap-2">
      <Button
        type="button"
        variant="outline"
        onClick={async () => {
          await navigator.clipboard.writeText(code);
          setDone(true);
        }}
      >
        {done ? "تم النسخ" : "نسخ الكود"}
      </Button>
      <a
        href={`https://wa.me/?text=${encodeURIComponent(text)}`}
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-4 text-sm self-center"
      >
        إرسال واتساب
      </a>
    </div>
  );
}

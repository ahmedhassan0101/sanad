// شاشة إدخال كود الدعوة للانضمام لمركز.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { OnboardingShell } from "@/components/onboarding-shell";
import { EnterCodeForm } from "./form";

export default function EnterCodePage() {
  return (
    <OnboardingShell title="عندي كود دعوة" description="اطلبه من مشرف مركزك ثم أدخله هنا">
      <EnterCodeForm />
      <Link href="/onboarding" className={buttonVariants({ variant: "ghost" })}>
        رجوع
      </Link>
    </OnboardingShell>
  );
}

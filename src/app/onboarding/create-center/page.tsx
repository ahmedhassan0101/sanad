// معالج إنشاء مركز: الخطوة 1 البيانات + الخطوة 2 البرامج — إرسال واحد.
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { OnboardingShell } from "@/components/onboarding-shell";
import { CreateCenterForm } from "./form";

export default function CreateCenterPage() {
  return (
    <OnboardingShell
      title="إنشاء مركز جديد"
      description="بياناتك الأساسية ثم برامج المركز"
      steps={["البيانات", "البرامج"]}
      current={0}
    >
      <CreateCenterForm />
      <Link href="/onboarding" className={buttonVariants({ variant: "ghost" })}>
        رجوع
      </Link>
    </OnboardingShell>
  );
}

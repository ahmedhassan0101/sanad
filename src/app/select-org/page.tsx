// اختيار المركز النشط عند تعدد العضويات (يعرض الدور في كل مركز).
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { Button, buttonVariants } from "@/components/ui/button";
import { listMyMemberships } from "@/services/org-selection";
import { OnboardingShell } from "@/components/onboarding-shell";
import { setActiveOrg } from "../onboarding/actions";
import { MEMBERSHIP_ROLES } from "@/constants";

export default async function SelectOrgPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const memberships = await listMyMemberships(session.user.id);
  if (memberships.length === 0) redirect("/onboarding");
  return (
    <OnboardingShell
      title="اختر المركز"
      description="لديك عضوية في أكثر من مركز"
    >
      <section className="flex flex-col gap-2" aria-label="مراكزك">
        {memberships.map((m) => (
          <form key={m.orgId} action={setActiveOrg}>
            <input type="hidden" name="orgId" value={m.orgId} />
            <Button
              type="submit"
              variant="outline"
              className="w-full justify-start"
            >
              {m.orgName} — {MEMBERSHIP_ROLES.labelOf(m.role)}{" "}
            </Button>
          </form>
        ))}
      </section>
      <section className="flex flex-col gap-2" aria-label="خيارات أخرى">
        <Link
          href="/onboarding/create-center"
          className={buttonVariants({ variant: "ghost" })}
        >
          إنشاء مركز جديد
        </Link>
        <Link
          href="/onboarding/enter-code"
          className={buttonVariants({ variant: "ghost" })}
        >
          عندي كود دعوة
        </Link>
      </section>
    </OnboardingShell>
  );
}

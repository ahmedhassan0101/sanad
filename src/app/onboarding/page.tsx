// شاشة البداية: عضوياتك + 3 كروت (إنشاء / كود / طفلي قريبًا).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Baby, Plus, Ticket } from "lucide-react";
import { auth } from "@/lib/auth/config";
import { listMyMemberships } from "@/services/org-selection";
import { viewer } from "@/services/viewer";
import { Button, buttonVariants } from "@/components/ui/button";
import { IconChip } from "@/components/brand";
import { OnboardingShell } from "@/components/onboarding-shell";
import { setActiveOrg } from "./actions";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind === "member") redirect("/dashboard");
  if (ctx.kind === "platform") redirect("/platform");
  const memberships = await listMyMemberships(session.user.id);
  return (
    <OnboardingShell
      title={`أهلاً ${session.user.name ?? ""}`}
      description="اختر مركزك أو ابدأ واحدًا جديدًا"
    >
      {memberships.length > 0 && (
        <section className="flex flex-col gap-2" aria-label="مراكزك">
          {memberships.map((m) => (
            <form key={m.orgId} action={setActiveOrg}>
              <input type="hidden" name="orgId" value={m.orgId} />
              <Button type="submit" variant="outline" className="w-full justify-start">
                دخول {m.orgName}
              </Button>
            </form>
          ))}
        </section>
      )}
      <section className="flex flex-col gap-2" aria-label="ابدأ">
        <Link
          href="/onboarding/create-center"
          className={buttonVariants({ className: "justify-start gap-3" })}
        >
          <IconChip tone="info">
            <Plus className="size-4" />
          </IconChip>
          إنشاء مركز جديد
        </Link>
        <Link
          href="/onboarding/enter-code"
          className={buttonVariants({ variant: "outline", className: "justify-start gap-3" })}
        >
          <IconChip>
            <Ticket className="size-4" />
          </IconChip>
          عندي كود دعوة
        </Link>
        <Button variant="ghost" disabled className="justify-start gap-3">
          <IconChip tone="success">
            <Baby className="size-4" />
          </IconChip>
          متابعة طفلي (قريبًا)
        </Button>
      </section>
    </OnboardingShell>
  );
}

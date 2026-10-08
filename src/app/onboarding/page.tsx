// شاشة البداية: عضوياتك + 3 كروت (إنشاء / كود / طفلي قريبًا).
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listMyMemberships } from "@/services/org-selection";
import { viewer } from "@/services/viewer";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
    <main className="flex min-h-svh items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle>أهلاً {session.user.name ?? ""}</CardTitle>
          <CardDescription>اختر مركزك أو ابدأ واحدًا جديدًا</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          {memberships.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="text-sm font-medium">مراكزك</h2>
              {memberships.map((m) => (
                <form key={m.orgId} action={setActiveOrg}>
                  <input type="hidden" name="orgId" value={m.orgId} />
                  <Button type="submit" variant="outline" className="w-full">
                    دخول {m.orgName}
                  </Button>
                </form>
              ))}
            </section>
          )}
          <section className="flex flex-col gap-2">
            <Link href="/onboarding/create-center" className={buttonVariants()}>
              إنشاء مركز جديد
            </Link>
            <Link href="/onboarding/enter-code" className={buttonVariants({ variant: "outline" })}>
              عندي كود دعوة
            </Link>
            <Button variant="ghost" disabled>
              متابعة طفلي (قريبًا)
            </Button>
          </section>
        </CardContent>
      </Card>
    </main>
  );
}

// شاشة البداية: عضوياتك + 3 كروت (إنشاء / كود / طفلي قريبًا).
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { listMyMemberships } from "@/services/org-selection";
import { setActiveOrg } from "./actions";

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const memberships = await listMyMemberships(session.user.id);
  return (
    <main>
      <h1>أهلاً {session.user.name ?? ""}</h1>
      {memberships.length > 0 && (
        <section>
          <h2>مراكزك</h2>
          {memberships.map((m) => (
            <form key={m.orgId} action={setActiveOrg}>
              <input type="hidden" name="orgId" value={m.orgId} />
              <button type="submit">دخول {m.orgName}</button>
            </form>
          ))}
        </section>
      )}
      <section>
        <h2>ابدأ</h2>
        <p>
          <Link href="/onboarding/create-center">إنشاء مركز جديد</Link>
        </p>
        <p>
          <Link href="/onboarding/enter-code">عندي كود دعوة</Link>
        </p>
        <p>
          <button type="button" disabled>
            متابعة طفلي (قريبًا)
          </button>
        </p>
      </section>
    </main>
  );
}

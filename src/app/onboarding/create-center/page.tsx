// معالج إنشاء مركز: الخطوة 1 البيانات + الخطوة 2 البرامج — إرسال واحد.
import { cookies } from "next/headers";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth/config";
import { PROGRAM_CATALOG } from "@/lib/programs";
import { createCenter } from "@/services/orgs";
import { customProgramKey } from "@/lib/programs";

export default function CreateCenterPage() {
  async function action(formData: FormData) {
    "use server";
    const session = await auth();
    if (!session?.user?.id) redirect("/login");
    const programs = formData.getAll("programs").map(String);
    const custom = String(formData.get("customProgram") ?? "").trim();
    if (custom) programs.push(customProgramKey(custom));
    try {
      const { orgId } = await createCenter(session.user.id, {
        name: String(formData.get("name") ?? ""),
        contactPhone: String(formData.get("contactPhone") ?? ""),
        addressText: String(formData.get("addressText") ?? "") || undefined,
        programs,
      });
      (await cookies()).set("active_org", orgId, { httpOnly: true, sameSite: "lax", path: "/" });
    } catch {
      redirect("/onboarding/create-center?error=1");
    }
    redirect("/dashboard");
  }
  return (
    <main>
      <h1>إنشاء مركز جديد</h1>
      <form action={action}>
        <fieldset>
          <legend>الخطوة 1: البيانات الأساسية</legend>
          <label>
            اسم المركز
            <input name="name" required minLength={2} maxLength={80} />
          </label>
          <label>
            رقم التواصل
            <input name="contactPhone" required dir="ltr" />
          </label>
          <label>
            العنوان (اختياري)
            <input name="addressText" maxLength={200} />
          </label>
        </fieldset>
        <fieldset>
          <legend>الخطوة 2: البرامج (واحد على الأقل)</legend>
          {PROGRAM_CATALOG.map((p) => (
            <label key={p.key}>
              <input type="checkbox" name="programs" value={p.key} /> {p.name}
            </label>
          ))}
          <label>
            برنامج باسم مخصص (اختياري)
            <input name="customProgram" maxLength={40} />
          </label>
        </fieldset>
        <button type="submit">إنشاء المركز</button>
      </form>
      <p>
        <Link href="/onboarding">رجوع</Link>
      </p>
    </main>
  );
}

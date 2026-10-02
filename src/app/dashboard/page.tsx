// لوحة تحكم المركز (فارغة الآن: اسم + فرع + دور + برامج).
import Link from "next/link";
import { redirect } from "next/navigation";
import { getDashboard } from "@/services/screens";
import { viewer } from "@/services/viewer";

const ROLE_NAMES: Record<string, string> = {
  center_admin: "مدير المركز",
  branch_admin: "مشرف فرع",
  teacher: "معلم",
};

export default async function DashboardPage() {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/onboarding");
  let data;
  try {
    data = await getDashboard(ctx);
  } catch {
    redirect("/onboarding");
  }
  const singleBranch = data.branches.length <= 1;
  return (
    <main>
      <h1>{data.orgName}</h1>
      <p>
        دورك: {ROLE_NAMES[data.role] ?? data.role}
        {!singleBranch && ` — ${data.branches.length} فروع`}
      </p>
      {!singleBranch && (
        <section>
          <h2>الفروع</h2>
          <ul>
            {data.branches.map((b) => (
              <li key={b.id}>{b.name}</li>
            ))}
          </ul>
        </section>
      )}
      <section>
        <h2>البرامج</h2>
        <ul>
          {data.programs.map((p) => (
            <li key={p.id}>{p.label}</li>
          ))}
        </ul>
      </section>
      <section>
        <h2>قريبًا</h2>
        <p>الطلاب والمجموعات والحضور — تُبنى في المرحلة الجاية.</p>
      </section>
      <p>
        <Link href="/onboarding">تبديل المركز</Link>
      </p>
    </main>
  );
}

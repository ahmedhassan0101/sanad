// شاشة المنصة الاطلاعية: أرقام فقط لكل مركز — بلا تفاصيل ولا بيانات طلاب.
import { redirect } from "next/navigation";
import { getPlatformStats } from "@/services/screens";
import { viewer } from "@/services/viewer";

export default async function PlatformPage() {
  const ctx = await viewer();
  if (ctx.kind !== "platform") redirect("/onboarding");
  const rows = await getPlatformStats();
  return (
    <main>
      <h1>نظرة عامة</h1>
      <ul>
        {rows.map((r) => (
          <li key={r.name}>
            {r.name} — فروع: {r.branches} — أعضاء: {r.members} — برامج: {r.programs} — تواصل:{" "}
            {r.contact}
          </li>
        ))}
      </ul>
    </main>
  );
}

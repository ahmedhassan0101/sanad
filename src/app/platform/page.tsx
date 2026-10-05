// شاشة المنصة الاطلاعية: أرقام فقط لكل مركز — بلا تفاصيل ولا بيانات طلاب.
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlatformStats } from "@/services/screens";
import { viewer } from "@/services/viewer";

export default async function PlatformPage() {
  const ctx = await viewer();
  if (ctx.kind !== "platform") redirect("/onboarding");
  const rows = await getPlatformStats();
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-4">
      <h1 className="text-xl font-bold">نظرة عامة</h1>
      {rows.map((r) => (
        <Card key={r.name}>
          <CardHeader>
            <CardTitle>{r.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              فروع: {r.branches} — أعضاء: {r.members} — برامج: {r.programs} — تواصل: {r.contact}
            </p>
          </CardContent>
        </Card>
      ))}
    </main>
  );
}

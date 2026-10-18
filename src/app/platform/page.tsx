// شاشة المنصة الاطلاعية: أرقام فقط لكل مركز — بلا تفاصيل ولا بيانات طلاب.
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PageContainer, PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { getPlatformStats } from "@/services/screens";
import { viewer } from "@/services/viewer";

export default async function PlatformPage() {
  const ctx = await viewer();
  if (ctx.kind === "unverified") redirect("/verify-pending");
  if (ctx.kind !== "platform") redirect("/onboarding");
  const rows = await getPlatformStats();
  return (
    <PageContainer narrow>
    <div className="flex flex-col gap-4">
      <PageHeader title="نظرة عامة" description="أرقام المراكز — اطلاع فقط" />
      {rows.map((r) => (
        <Card key={r.name}>
          <CardHeader>
            <CardTitle>{r.name}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-2">
              <StatCard title="الفروع" value={r.branches} />
              <StatCard title="الأعضاء" value={r.members} />
            </div>
            <p className="text-sm text-muted-foreground">تواصل: {r.contact}</p>
          </CardContent>
        </Card>
      ))}
    </div>
    </PageContainer>
  );
}

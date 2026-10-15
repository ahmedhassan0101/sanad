// صفحة مؤقتة: تُبنى في مرحلة لاحقة.
import { Construction } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { IconChip } from "@/components/brand";
import { EmptyState } from "@/components/empty-state";
import { PageContainer, PageHeader } from "@/components/page-header";

export function PlaceholderPage({ title }: { title?: string }) {
  return (
    <PageContainer>
      <div className="flex flex-col gap-4">
        <PageHeader title={title ?? "قريبًا"} />
        <Card>
          <CardContent className="pt-4">
            <EmptyState
              icon={
                <IconChip>
                  <Construction className="size-5" />
                </IconChip>
              }
              title="هذه الصفحة تُبنى في المرحلة الجاية"
              description="الأساس جاهز — الواجهة الكاملة قريبًا"
            />
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}

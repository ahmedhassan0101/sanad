// صفحة الفريق: دعوات + أعضاء — للمشرفين فقط (الفحص في السيرفر).
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { viewer } from "@/services/viewer";
import { createInviteAction, revokeInviteAction, teamData, updateMemberAction } from "./actions";
import { CopyInvite } from "./copy-button";

const ROLE_NAMES: Record<string, string> = {
  center_admin: "مدير مركز",
  branch_admin: "مشرف فرع",
  teacher: "معلم",
};

export default async function TeamPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; error?: string }>;
}) {
  const ctx = await viewer();
  if (ctx.kind !== "member") redirect("/verify-pending");
  const sp = await searchParams;
  const data = await teamData().catch(() => null);
  if (!data) redirect("/dashboard");
  const roleOptions =
    data.role === "center_admin" ? ["center_admin", "branch_admin", "teacher"] : ["branch_admin", "teacher"];
  const branchName = new Map(data.branches.map((b) => [b.id, b.name]));
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">الفريق</h1>
      {sp.error && <p className="text-sm text-destructive">تعذر تنفيذ العملية — تحقق من الصلاحيات</p>}
      {sp.created && (
        <Card>
          <CardHeader>
            <CardTitle>الكود (يظهر مرة واحدة)</CardTitle>
            <CardDescription className="text-lg font-bold" dir="ltr">
              {sp.created}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CopyInvite code={sp.created} />
          </CardContent>
        </Card>
      )}
      <Card>
        <CardHeader>
          <CardTitle>دعوة جديدة</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createInviteAction} className="flex flex-col gap-3">
            <label className="text-sm">
              الدور
              <select name="role" className="mt-1 w-full rounded-md border p-2" defaultValue="teacher">
                {roleOptions.map((r) => (
                  <option key={r} value={r}>
                    {ROLE_NAMES[r]}
                  </option>
                ))}
              </select>
            </label>
            {data.branches.length > 1 ? (
              <label className="text-sm">
                الفرع
                <select name="branchId" className="mt-1 w-full rounded-md border p-2">
                  {data.branches.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </label>
            ) : (
              <input type="hidden" name="branchId" value={data.branches[0]?.id ?? ""} />
            )}
            <label className="text-sm">
              المدة بالأيام (حتى 7)
              <input name="days" type="number" min={1} max={7} defaultValue={2} className="mt-1 w-full rounded-md border p-2" dir="ltr" />
            </label>
            <Button type="submit">إنشاء الكود</Button>
          </form>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>الدعوات الفعّالة</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {data.invites.length === 0 && <p className="text-sm text-muted-foreground">لا دعوات فعّالة</p>}
          {data.invites.map((i) => (
            <form key={i.id} action={revokeInviteAction.bind(null, i.id)} className="flex items-center justify-between gap-2 text-sm">
              <span>
                {ROLE_NAMES[i.role]} — {i.branchId ? branchName.get(i.branchId) ?? "" : "كل الفروع"}
              </span>
              <Button type="submit" variant="outline" size="sm">
                إلغاء
              </Button>
            </form>
          ))}
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>الأعضاء</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3">
          {data.members.map((m) => (
            <div key={m.userId} className="flex flex-col gap-1 border-b pb-2 text-sm">
              <span>
                {m.name} — {m.email} — {ROLE_NAMES[m.role]} — {m.status === "active" ? "مفعّل" : "معطّل"}
              </span>
              <div className="flex gap-2">
                <form action={updateMemberAction.bind(null, m.userId)} className="flex gap-2">
                  <select name="role" defaultValue={m.role} className="rounded-md border p-1">
                    {roleOptions.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_NAMES[r]}
                      </option>
                    ))}
                  </select>
                  <Button type="submit" variant="outline" size="sm">
                    تغيير الدور
                  </Button>
                </form>
                <form action={updateMemberAction.bind(null, m.userId)}>
                  <input type="hidden" name="status" value={m.status === "active" ? "disabled" : "active"} />
                  <Button type="submit" variant="outline" size="sm">
                    {m.status === "active" ? "تعطيل" : "تفعيل"}
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}

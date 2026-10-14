// فورم الدعوة: Server Action يُرجع الكود كحالة — بلا redirect ولا كود في الـ URL.
"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createInviteAction, type InviteState } from "./actions";
import { CopyInvite } from "./copy-button";

export function InviteForm({
  roles,
  branches,
}: {
  roles: { value: string; label: string }[];
  branches: { id: string; name: string }[];
}) {
  const [state, action, pending] = useActionState<InviteState, FormData>(
    createInviteAction,
    { ok: false },
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>دعوة جديدة</CardTitle>
        <CardDescription>صالحة لمدة 48 ساعة من الإنشاء</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <form action={action} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            الدور
            <Select name="role" defaultValue="supervisor">
              <SelectTrigger>
                <SelectValue placeholder="اختر الدور…" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((r) => (
                  <SelectItem key={r.value} value={r.value}>
                    {r.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
          {branches.length > 1 ? (
            <label className="flex flex-col gap-1 text-sm">
              الفرع
              <Select name="branchId" defaultValue={branches[0]?.id ?? ""}>
                <SelectTrigger>
                  <SelectValue placeholder="اختر الفرع…" />
                </SelectTrigger>
                <SelectContent>
                  {branches.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </label>
          ) : (
            <input type="hidden" name="branchId" value={branches[0]?.id ?? ""} />
          )}
          {state.message && (
            <p className="text-sm text-destructive">{state.message}</p>
          )}
          <Button type="submit" disabled={pending}>
            {pending ? "جارٍ الإنشاء…" : "إنشاء الكود"}
          </Button>
        </form>
        {state.ok && state.code && (
          <div className="flex flex-col gap-2 rounded-md border p-3">
            <p className="text-sm font-medium">الكود (يظهر هنا فقط)</p>
            <p className="text-lg font-bold" dir="ltr">
              {state.code}
            </p>
            <CopyInvite code={state.code} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

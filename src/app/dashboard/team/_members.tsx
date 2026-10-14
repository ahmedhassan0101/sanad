// قائمة الأعضاء: تغيير الدور بـ Select، وتفعيل/تعطيل عبر قائمة + حوار تأكيد.
"use client";

import { useState } from "react";
import { MoreVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateMemberAction } from "./actions";

type Member = {
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

export function MembersCard({
  members,
  roles,
}: {
  members: Member[];
  roles: { value: string; label: string }[];
}) {
  const [confirm, setConfirm] = useState<Member | null>(null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>الأعضاء</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {members.map((m) => (
          <div
            key={m.userId}
            className="flex items-center justify-between gap-2 border-b pb-2 text-sm last:border-0"
          >
            <div className="flex flex-col">
              <span className="font-medium">{m.name}</span>
              <span className="text-xs text-muted-foreground">
                {m.email} — {roles.find((r) => r.value === m.role)?.label ?? m.role} —{" "}
                {m.status === "active" ? "مفعّل" : "معطّل"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <form
                action={updateMemberAction.bind(null, m.userId)}
                className="flex gap-1"
              >
                <Select name="role" defaultValue={m.role}>
                  <SelectTrigger size="sm" aria-label="تغيير الدور">
                    <SelectValue placeholder="الدور" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button type="submit" variant="outline" size="sm">
                  حفظ
                </Button>
              </form>
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button variant="outline" size="icon" aria-label={`إجراءات ${m.name}`} />
                  }
                >
                  <MoreVertical className="size-4" />
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setConfirm(m)}>
                    {m.status === "active" ? "تعطيل" : "تفعيل"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        ))}
      </CardContent>
      <Dialog open={confirm !== null} onOpenChange={(o) => !o && setConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {confirm?.status === "active" ? "تعطيل العضو؟" : "تفعيل العضو؟"}
            </DialogTitle>
            <DialogDescription>
              {confirm?.name} — سيتغير وصوله للمركز فورًا.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirm(null)}>
              إلغاء
            </Button>
            {confirm && (
              <form
                action={updateMemberAction.bind(null, confirm.userId)}
                onSubmit={() => setConfirm(null)}
              >
                <input
                  type="hidden"
                  name="status"
                  value={confirm.status === "active" ? "disabled" : "active"}
                />
                <Button type="submit">تأكيد</Button>
              </form>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

// قائمة المستخدم: الحساب + تبديل المركز + إنشاء/كود + خروج (زر السمة منفصل في الشريط).
"use client";

import Link from "next/link";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function UserMenu({
  name,
  memberships,
  logout,
}: {
  name: string;
  memberships: { orgId: string; orgName: string }[];
  logout: () => Promise<void>;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="outline" className="max-w-36">
            <span className="truncate">{name}</span>
            <ChevronDown className="size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-44">
        <DropdownMenuItem render={<Link href="/dashboard/settings" />}>
          الحساب
        </DropdownMenuItem>
        {memberships.map((m) => (
          <DropdownMenuItem key={m.orgId} render={<Link href={`/select-org`} />}>
            تبديل إلى {m.orgName}
          </DropdownMenuItem>
        ))}
        <DropdownMenuItem render={<Link href="/onboarding/create-center" />}>
          إنشاء مركز آخر
        </DropdownMenuItem>
        <DropdownMenuItem render={<Link href="/onboarding/enter-code" />}>
          عندي كود دعوة
        </DropdownMenuItem>
        <form action={logout} className="p-1">
          <Button type="submit" variant="ghost" size="sm" className="w-full justify-start">
            خروج
          </Button>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

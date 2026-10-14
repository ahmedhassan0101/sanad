// الشريط الجانبي: عناصر حسب الدور + درج في الموبايل (تحت xl).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  ClipboardCheck,
  GraduationCap,
  Home,
  Menu,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function itemsFor(role: string) {
  return [
    { href: "/dashboard", label: "الرئيسية", icon: Home, show: true },
    { href: "/dashboard/team", label: "الفريق", icon: Users, show: role !== "supervisor" },
    { href: "/dashboard/students", label: "الطلاب", icon: GraduationCap, show: true },
    { href: "/dashboard/groups", label: "المجموعات", icon: BookOpen, show: true },
    { href: "/dashboard/attendance", label: "الحضور", icon: ClipboardCheck, show: true },
    { href: "/dashboard/settings", label: "الإعدادات", icon: Settings, show: role !== "supervisor" },
  ].filter((i) => i.show);
}

function Nav({ role, pathname, onNavigate }: { role: string; pathname: string; onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-1 p-3">
      {itemsFor(role).map((i) => (
        <Link
          key={i.href}
          href={i.href}
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-2 rounded-md px-3 py-2 text-sm",
            pathname === i.href ? "bg-accent font-medium" : "hover:bg-accent"
          )}
        >
          <i.icon className="size-4" />
          {i.label}
        </Link>
      ))}
    </nav>
  );
}

// زر القائمة + الدرج للموبايل — يوضع في الشريط العلوي.
export function MobileSidebar({ role }: { role: string }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  return (
    <div className="xl:hidden">
      <Button variant="outline" size="icon" aria-label="القائمة" onClick={() => setOpen(!open)}>
        {open ? <X className="size-4" /> : <Menu className="size-4" />}
      </Button>
      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-60 bg-background shadow-elevation-3">
            <Nav role={role} pathname={pathname} onNavigate={() => setOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}

// الشريط الثابت للشاشات الكبيرة — يوضع بجانب المحتوى.
export function DesktopSidebar({ role }: { role: string }) {
  const pathname = usePathname();
  return (
    <aside className="hidden w-60 shrink-0 border-e xl:block">
      <Nav role={role} pathname={pathname} />
    </aside>
  );
}

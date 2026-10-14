// الشريط الجانبي: عناصر مجمعة حسب الدور + درج في الموبايل (تحت xl).
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  BookOpen,
  Building2,
  ClipboardCheck,
  GraduationCap,
  Home,
  Menu,
  Presentation,
  Settings,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof Home; show: boolean };

function groupsFor(role: string): { title: string; items: Item[] }[] {
  const all: Item[] = [
    { href: "/dashboard", label: "الرئيسية", icon: Home, show: true },
    { href: "/dashboard/students", label: "الطلاب", icon: GraduationCap, show: true },
    { href: "/dashboard/teachers", label: "المعلمون", icon: Presentation, show: true },
    { href: "/dashboard/groups", label: "المجموعات", icon: BookOpen, show: true },
    { href: "/dashboard/attendance", label: "الحضور", icon: ClipboardCheck, show: true },
    { href: "/dashboard/team", label: "الفريق", icon: Users, show: role !== "supervisor" },
    { href: "/dashboard/branches", label: "الفروع", icon: Building2, show: role === "center_admin" },
    { href: "/dashboard/settings", label: "الإعدادات", icon: Settings, show: role !== "supervisor" },
  ];
  const visible = all.filter((i) => i.show);
  return [
    { title: "عام", items: visible.filter((i) => i.href === "/dashboard") },
    {
      title: "التعليم",
      items: visible.filter((i) =>
        ["/dashboard/students", "/dashboard/teachers", "/dashboard/groups", "/dashboard/attendance"].includes(i.href),
      ),
    },
    {
      title: "الإدارة",
      items: visible.filter((i) =>
        ["/dashboard/team", "/dashboard/branches", "/dashboard/settings"].includes(i.href),
      ),
    },
  ].filter((g) => g.items.length > 0);
}

function isActive(pathname: string, href: string) {
  return href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

function Nav({ role, pathname, onNavigate }: { role: string; pathname: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="التنقل الرئيسي" className="flex flex-col gap-3 p-3">
      {groupsFor(role).map((g) => (
        <div key={g.title} className="flex flex-col gap-1">
          <p className="px-3 text-xs text-muted-foreground">{g.title}</p>
          {g.items.map((i) => {
            const active = isActive(pathname, i.href);
            return (
              <Link
                key={i.href}
                href={i.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-10 items-center gap-2 rounded-md border-s-2 px-3 py-2 text-sm",
                  active
                    ? "border-primary bg-accent font-medium"
                    : "border-transparent hover:bg-accent",
                )}
              >
                <i.icon className="size-4 shrink-0" />
                {i.label}
              </Link>
            );
          })}
        </div>
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
          <div className="absolute inset-0 bg-foreground/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 right-0 w-60 overflow-y-auto bg-surface-1 shadow-elevation-3">
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
    <aside className="hidden w-60 shrink-0 border-e bg-surface-1 xl:block">
      <Nav role={role} pathname={pathname} />
    </aside>
  );
}

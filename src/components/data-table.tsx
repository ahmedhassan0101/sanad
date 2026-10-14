// غلاف الجداول: شريط أدوات فوق الجدول، رأس هادئ، كثافتان، ترقيم، وتمرير مرتب على الموبايل.
"use client";

import type { ReactNode } from "react";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

export function DataTable({
  toolbar,
  headers,
  children,
  empty,
  density = "comfortable",
  page,
  total,
  pageSize,
  onPage,
}: {
  toolbar?: ReactNode;
  headers: string[];
  children: ReactNode;
  empty?: ReactNode;
  density?: "comfortable" | "compact";
  page?: number;
  total?: number;
  pageSize?: number;
  onPage?: (page: number) => void;
}) {
  const cellPad = density === "compact" ? "px-3 py-1.5" : "px-3 py-3";
  const pages =
    page !== undefined && total !== undefined && pageSize
      ? Math.max(1, Math.ceil(total / pageSize))
      : 1;
  return (
    <div className="flex flex-col gap-3">
      {toolbar}
      <div className="overflow-x-auto rounded-lg border border-border bg-surface-1 shadow-elevation-1">
        <table className="w-full min-w-xl border-collapse text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50 text-start">
              {headers.map((h) => (
                <th
                  key={h}
                  scope="col"
                  className={cn(cellPad, "text-start text-xs font-medium text-muted-foreground")}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
        {empty}
      </div>
      {onPage && page !== undefined && pages > 1 && (
        <nav aria-label="ترقيم الصفحات" className="flex items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            صفحة {page} من {pages}
          </span>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPage(page - 1)}
            >
              السابق
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={page >= pages}
              onClick={() => onPage(page + 1)}
            >
              التالي
            </Button>
          </div>
        </nav>
      )}
    </div>
  );
}

export function DataRow({ children }: { children: ReactNode }) {
  return (
    <tr className="border-b border-border-subtle last:border-0 hover:bg-muted/30">
      {children}
    </tr>
  );
}

export function DataCell({
  children,
  numeric,
  density = "comfortable",
}: {
  children: ReactNode;
  numeric?: boolean;
  density?: "comfortable" | "compact";
}) {
  return (
    <td
      className={cn(
        "px-3",
        density === "compact" ? "py-1.5" : "py-3",
        numeric && "font-data",
      )}
    >
      {children}
    </td>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — DashboardShell
   Client wrapper that reads sidebar collapsed state from Zustand
   and adjusts the main content margin accordingly.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { type ReactNode } from "react";
import { useUIStore } from "@/store";
import { cn } from "@/lib/utils";

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const sidebarCollapsed = useUIStore((s) => s.sidebarCollapsed);

  return (
    <div
      className={cn(
        "flex flex-1 flex-col transition-all duration-200",
        sidebarCollapsed ? "lg:ml-[68px]" : "lg:ml-64"
      )}
    >
      {children}
    </div>
  );
}

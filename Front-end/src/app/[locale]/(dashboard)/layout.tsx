/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard Layout
   Shell for all authenticated pages: navbar + content area.
   ═══════════════════════════════════════════════════════════════════ */

import { type ReactNode } from "react";
import { Navbar } from "@/components/layout/Navbar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main
        id="main-content"
        tabIndex={-1}
        className="flex-1 p-4 pt-[calc(14*4px+1rem)] lg:p-6 lg:pt-[calc(14*4px+1.5rem)]"
      >
        {children}
      </main>
    </div>
  );
}

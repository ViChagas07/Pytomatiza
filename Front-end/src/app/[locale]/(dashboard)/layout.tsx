/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard Layout
   Shell for all authenticated pages: automation serpent background +
   navbar + content area. The serpent reflects the user's chosen
   accent color and adapts to light/dark mode automatically.
   ═══════════════════════════════════════════════════════════════════ */

import { type ReactNode } from "react";
import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { AuraBackground } from "@/components/layout/AuraBackground";
import { Shield } from "lucide-react";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <AuraBackground />
      <Navbar />

      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-[1] flex-1 p-4 pt-[calc(14*4px+1rem)] lg:p-6 lg:pt-[calc(14*4px+1.5rem)]"
      >
        {children}
      </main>

      {/* ── Dashboard Footer ──────────────────────────────────── */}
      <footer className="relative z-[1] border-t border-[var(--border-default)] bg-[var(--surface-0)]/80 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 lg:px-6 py-4 flex flex-wrap items-center justify-between gap-3">
          <span className="text-[11px] text-[var(--text-tertiary)]">
            © {new Date().getFullYear()} Pytomatiza+. Todos os direitos reservados.
          </span>
          <nav className="flex items-center gap-4" aria-label="Links legais">
            <Link
              href="/privacy-policy"
              className="text-[11px] text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors flex items-center gap-1"
            >
              <Shield className="h-3 w-3" />
              Privacidade & Termos
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — MobileMenu
   Full-width bottom sheet for mobile navigation.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  ClipboardList,
  X,
  FileText,
  Table2,
  MessageSquare,
  Image,
  FolderOpen,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Nav items (mirror of Navbar) ─────────────────────────────── */

interface NavItemDef {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}

const primaryNavItems: NavItemDef[] = [
  {
    href: "/dashboard",
    labelKey: "dashboard",
    icon: LayoutDashboard,
    testId: "nav-dashboard",
  },
  {
    href: "/automations",
    labelKey: "automations",
    icon: Workflow,
    testId: "nav-automations",
  },
  {
    href: "/agents",
    labelKey: "agents",
    icon: Bot,
    testId: "nav-agents",
  },
  {
    href: "/logs",
    labelKey: "logs",
    icon: ClipboardList,
    testId: "nav-logs",
  },
];

/* ── Module items (mirror of ModulesDropdown) ───────────────────── */

interface ModuleDef {
  id: string;
  nameKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
}

const moduleItems: ModuleDef[] = [
  { id: "documents", nameKey: "documents", icon: FileText, href: "/documents" },
  { id: "data", nameKey: "data", icon: Table2, href: "/data" },
  { id: "communication", nameKey: "communication", icon: MessageSquare, href: "/communication" },
  { id: "media", nameKey: "media", icon: Image, href: "/media" },
  { id: "files", nameKey: "files", icon: FolderOpen, href: "/files" },
  { id: "architecture", nameKey: "architecture", icon: Layers, href: "/architecture" },
];

/* ── Focus trap hook ────────────────────────────────────────────── */

function useFocusTrap(
  containerRef: React.RefObject<HTMLElement | null>,
  isActive: boolean
) {
  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const getFocusable = () =>
      Array.from(
        container.querySelectorAll<HTMLElement>(
          'a[href], button, input, select, textarea, [tabindex]:not([tabindex="-1"])'
        )
      ).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-hidden") !== "true");

    const focusable = getFocusable();
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || focusable.length === 0) return;

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    const timer = setTimeout(() => {
      const updated = getFocusable();
      updated[0]?.focus();
    }, 10);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      clearTimeout(timer);
    };
  }, [isActive, containerRef]);
}

/* ── Props ──────────────────────────────────────────────────────── */

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

/* ── Component ───────────────────────────────────────────────────── */

export function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const panelRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, isOpen);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  /* Module active detection */
  const modulePaths = ["/documents", "/data", "/communication", "/media", "/files", "/architecture"];
  const isModuleActive = (href: string) => pathname.startsWith(href);

  /* Escape key */
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex flex-col md:hidden" aria-hidden="false">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Bottom sheet */}
      <div
        ref={panelRef}
        id="mobile-menu-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("openMenu")}
        data-testid="mobile-menu-panel"
        className={cn(
          "relative mt-auto w-full max-h-[85vh] overflow-y-auto",
          "rounded-t-[var(--radius-lg)] border-t border-[var(--border-default)]",
          "bg-[var(--surface-0)] shadow-[var(--shadow-md)]"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-default)]">
          <span className="text-base font-semibold text-[var(--text-primary)]">
            {t("primary")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeMenu")}
            data-testid="mobile-menu-close"
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]",
              "text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--brand-accent)]"
            )}
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {/* Primary nav links */}
        <nav aria-label={t("primary")} className="px-4 py-2">
          <ul className="space-y-1" role="list">
            {primaryNavItems.map(({ href, labelKey, icon: Icon, testId }) => (
              <li key={href}>
                <Link
                  href={href}
                  onClick={onClose}
                  data-testid={testId}
                  aria-current={isActive(href) ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-4 rounded-[var(--radius-md)] px-3 py-3",
                    "text-sm font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--brand-accent)]",
                    isActive(href)
                      ? "bg-[var(--brand-accent)] text-white font-semibold"
                      : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                  {t(labelKey)}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        {/* Modules section (expanded by default on mobile) */}
        <div className="border-t border-[var(--border-default)] px-4 py-3">
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wider text-[var(--text-tertiary)]">
            {t("modules")}
          </h2>
          <ul className="grid grid-cols-2 gap-2" role="list">
            {moduleItems.map(({ id, nameKey, icon: Icon, href }) => {
              const active = isModuleActive(href);
              return (
              <li key={id}>
                <Link
                  href={href}
                  onClick={onClose}
                  data-testid={`mobile-module-${id}`}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2.5",
                    "text-sm font-medium transition-colors",
                    "focus-visible:outline-2 focus-visible:outline-offset-2",
                    "focus-visible:outline-[var(--brand-accent)]",
                    active
                      ? "border-[var(--brand-accent)] bg-[var(--brand-accent)] text-white font-semibold"
                      : "border border-[var(--border-default)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
                  )}
                >
                  <Icon className="h-4 w-4" aria-hidden="true" />
                  {t(nameKey)}
                </Link>
              </li>
              );
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}

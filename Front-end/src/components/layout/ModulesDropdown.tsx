/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — ModulesDropdown
   Full-width mega-dropdown below the Navbar.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  X,
  FileText,
  Table2,
  MessageSquare,
  Image,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Module definitions ─────────────────────────────────────────── */

interface ModuleDef {
  id: string;
  nameKey: string;
  descKey: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  tags: string[];
}

const modules: ModuleDef[] = [
  {
    id: "documents",
    nameKey: "documents",
    descKey: "documentsDesc",
    icon: FileText,
    href: "/documents",
    tags: ["PDF", "DOCX"],
  },
  {
    id: "data",
    nameKey: "data",
    descKey: "dataDesc",
    icon: Table2,
    href: "/data",
    tags: ["CSV", "SQL"],
  },
  {
    id: "communication",
    nameKey: "communication",
    descKey: "communicationDesc",
    icon: MessageSquare,
    href: "/communication",
    tags: ["Email", "Chat"],
  },
  {
    id: "media",
    nameKey: "media",
    descKey: "mediaDesc",
    icon: Image,
    href: "/media",
    tags: ["JPG", "PNG", "SVG"],
  },
  {
    id: "files",
    nameKey: "files",
    descKey: "filesDesc",
    icon: FolderOpen,
    href: "/files",
    tags: ["Storage"],
  },
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
      ).filter((el) => !el.hasAttribute("disabled") && !el.getAttribute("aria-hidden"));

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
    // small delay to let DOM settle
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

interface ModulesDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  /** Ref to the toggle button — excluded from click-outside detection */
  triggerRef?: React.RefObject<HTMLElement | null>;
  /** Current active module path (e.g., "/documents") */
  activeHref?: string | null;
}

/* ── Component ───────────────────────────────────────────────────── */

export function ModulesDropdown({ isOpen, onClose, triggerRef, activeHref }: ModulesDropdownProps) {
  const t = useTranslations("nav");
  const panelRef = React.useRef<HTMLDivElement>(null);

  useFocusTrap(panelRef, isOpen);

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

  /* Click outside — excludes the trigger button */
  React.useEffect(() => {
    if (!isOpen) return;
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as Node;
      // Don't close if clicking the trigger button (it toggles on click)
      if (triggerRef?.current && triggerRef.current.contains(target)) return;
      if (panelRef.current && !panelRef.current.contains(target)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleMouseDown);
    return () => document.removeEventListener("mousedown", handleMouseDown);
  }, [isOpen, onClose, triggerRef]);

  return (
    <div
      ref={panelRef}
      id="modules-panel"
      role="region"
      aria-label={t("modulesPanel")}
      data-testid="modules-panel"
      className={cn(
        "absolute left-0 right-0 top-14 z-40",
        "border-b border-[var(--border-default)] bg-[var(--surface-0)]",
        "shadow-[var(--shadow-md)]",
        "max-h-[320px] overflow-y-auto",
        !isOpen && "hidden"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-[var(--border-default)]">
        <span className="text-sm font-semibold text-[var(--text-primary)]">
          {t("modules")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("closeModules")}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)]",
            "text-[var(--text-tertiary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-1",
            "focus-visible:outline-[var(--brand-accent)]"
          )}
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
        {modules.map(({ id, nameKey, descKey, icon: Icon, href, tags }) => {
          const isActiveModule = activeHref === href;
          return (
          <Link
            key={id}
            href={href}
            onClick={onClose}
            data-testid={`module-${id}`}
            aria-current={isActiveModule ? "page" : undefined}
            className={cn(
              "flex items-start gap-4 rounded-[var(--radius-lg)] border p-4 shadow-[var(--shadow-sm)] transition-colors",
              "focus-visible:outline-2 focus-visible:outline-offset-2",
              "focus-visible:outline-[var(--brand-accent)]",
              isActiveModule
                ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)]"
                : "border-[var(--border-default)] bg-[var(--surface-0)] hover:bg-[var(--surface-1)]"
            )}
          >
            <div className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors",
              isActiveModule ? "bg-[var(--brand-accent)]" : "bg-[var(--brand-accent-light)]"
            )}>
              <Icon className={cn("h-5 w-5", isActiveModule ? "text-[var(--brand-accent-foreground)]" : "text-[var(--brand-accent)]")} aria-hidden="true" />
            </div>
            <div className="min-w-0">
              <h3 className={cn("text-sm font-semibold", isActiveModule ? "text-[var(--brand-accent)]" : "text-[var(--text-primary)]")}>
                {t(nameKey)}
              </h3>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                {t(descKey)}
              </p>
              <div className="mt-2 flex flex-wrap gap-1">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className={cn(
                      "inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-medium",
                      isActiveModule
                        ? "border-[var(--brand-accent)]/30 bg-[var(--brand-accent)]/10 text-[var(--brand-accent)]"
                        : "border-[var(--border-default)] bg-[var(--surface-1)] text-[var(--text-tertiary)]"
                    )}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </Link>
          );
        })}
      </div>
    </div>
  );
}

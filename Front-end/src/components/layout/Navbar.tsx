/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — Navbar
   Full-width horizontal sticky header. Replaces Sidebar + Header.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard,
  Bot,
  Workflow,
  ClipboardList,
  Menu,
  ChevronDown,
  ChevronUp,
  Grid3X3,
  Settings,
  Home,
  LogIn,
  LogOut,
} from "lucide-react";
import { useSession, signIn, signOut } from "next-auth/react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Link, usePathname } from "@/i18n/navigation";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { SkipLink } from "@/components/ui/SkipLink";
import { cn } from "@/lib/utils";
import { ModulesDropdown } from "./ModulesDropdown";
import { MobileMenu } from "./MobileMenu";

/* ── Nav items ──────────────────────────────────────────────────── */

interface NavItemDef {
  href: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  testId: string;
}

const primaryNavItems: NavItemDef[] = [
  {
    href: "/",
    labelKey: "home",
    icon: Home,
    testId: "nav-home",
  },
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

/* ── Component ───────────────────────────────────────────────────── */

export function Navbar() {
  const t = useTranslations("nav");
  const pathname = usePathname();
  const { data: session } = useSession();
  const userName = session?.user?.name || t("user");

  const [isModulesOpen, setIsModulesOpen] = React.useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [scrolled, setScrolled] = React.useState(false);

  const modulesButtonRef = React.useRef<HTMLButtonElement>(null);
  const mobileTriggerRef = React.useRef<HTMLButtonElement>(null);

  /* Scroll listener */
  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* Close panels on route change */
  React.useEffect(() => {
    setIsModulesOpen(false);
    setIsMobileMenuOpen(false);
  }, [pathname]);

  /* Lock body scroll when mobile menu is open */
  React.useEffect(() => {
    document.body.style.overflow = isMobileMenuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  /* Module pages — for active state on the Modules toggle */
  const modulePaths = ["/documents", "/data", "/communication", "/media", "/files", "/architecture"];
  const isOnModulePage = modulePaths.some((p) => pathname.startsWith(p));
  const activeModulePath = modulePaths.find((p) => pathname.startsWith(p)) || null;

  return (
    <>
      <SkipLink />
      <header
        className={cn(
          "sticky top-0 z-50 h-14 w-full",
          "border-b border-[var(--border-default)]",
          "bg-[var(--surface-0)]",
          scrolled && "bg-[var(--surface-0)]/85 backdrop-blur-[8px]"
        )}
        data-testid="navbar"
      >
        <div className="flex h-full items-center justify-between px-4 lg:px-6">
          {/* ── Left: Logo ─────────────────────────────────────────── */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold tracking-tight"
          >
            <Image
              src="/Pytomatiza_Logo_Supremo.png"
              alt=""
              width={36}
              height={36}
              className="rounded-[var(--radius-sm)]"
              aria-hidden="true"
            />
            <span className="text-[var(--brand-python-blue)]" style={{ fontFamily: "var(--font-aref-ruqaa)" }}>Pytomatiza</span>
            <span className="-ml-2 text-[var(--brand-accent-dynamic)]">+</span>
          </Link>

          {/* ── Center: Desktop nav ──────────────────────────────── */}
          <nav
            className="hidden items-center gap-1 md:flex"
            aria-label={t("primary")}
          >
            {primaryNavItems.map(({ href, labelKey, icon: Icon, testId }) => (
              <Link
                key={href}
                href={href}
                data-testid={testId}
                aria-current={isActive(href) ? "page" : undefined}
                className={cn(
                  "group relative flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2",
                  "text-sm font-medium transition-all duration-200 ease-out",
                  "focus-visible:outline-2 focus-visible:outline-offset-2",
                  "focus-visible:outline-[var(--brand-accent)]",
                  /* Active page — solid accent highlight */
                  isActive(href)
                    ? "text-[var(--brand-accent-foreground)] bg-[var(--brand-accent)] font-semibold"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
                )}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                <span className="hidden lg:inline">{t(labelKey)}</span>
                {/* Tablet tooltip (icon-only) */}
                <span
                  role="tooltip"
                  className={cn(
                    "pointer-events-none absolute left-1/2 top-full mt-2 -translate-x-1/2",
                    "rounded-[var(--radius-md)] bg-[var(--text-primary)] px-2 py-1",
                    "text-xs text-[var(--text-inverse)] opacity-0 transition-opacity",
                    "whitespace-nowrap",
                    "group-hover:opacity-100 group-focus:opacity-100",
                    "lg:hidden"
                  )}
                >
                  {t(labelKey)}
                </span>
                {/* Accent bottom marker — active page indicator */}
                {isActive(href) && (
                  <span
                    className="absolute bottom-0.5 left-3 right-3 h-1 rounded-full bg-[var(--brand-accent)]"
                    aria-hidden="true"
                  />
                )}
              </Link>
            ))}

            {/* Modules toggle */}
            <button
              ref={modulesButtonRef}
              type="button"
              onClick={() => setIsModulesOpen((p) => !p)}
              aria-expanded={isModulesOpen}
              aria-controls="modules-panel"
              data-testid="modules-toggle"
              className={cn(
                "relative flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-2",
                "text-sm font-medium transition-all duration-150 ease-out",
                "focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--brand-accent)]",
                (isModulesOpen || isOnModulePage)
                  ? "text-[var(--brand-accent-foreground)] bg-[var(--brand-accent)] font-semibold"
                  : "text-[var(--text-secondary)]"
              )}
              onMouseEnter={(e) => {
                if (!isModulesOpen) {
                  e.currentTarget.style.backgroundColor = "var(--surface-1)";
                  e.currentTarget.style.color = "var(--text-primary)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isModulesOpen) {
                  e.currentTarget.style.backgroundColor = "";
                  e.currentTarget.style.color = "";
                }
              }}
            >
              <Grid3X3 className="h-4 w-4" aria-hidden="true" />
              <span className="hidden lg:inline">{t("modules")}</span>
              {isModulesOpen ? (
                <ChevronUp
                  className="h-3.5 w-3.5 rotate-180 transition-transform"
                  aria-hidden="true"
                />
              ) : (
                <ChevronDown
                  className="h-3.5 w-3.5 transition-transform"
                  aria-hidden="true"
                />
              )}
              {/* Accent bottom marker — active page indicator */}
              {isOnModulePage && !isModulesOpen && (
                <span
                  className="absolute bottom-0.5 left-3 right-3 h-1 rounded-full bg-[var(--brand-accent)]"
                  aria-hidden="true"
                />
              )}
            </button>
          </nav>

          {/* ── Right: Tools ─────────────────────────────────────── */}
          <div className="flex items-center gap-1">
            <div className="hidden items-center gap-1 md:flex">
              <ThemeToggle />
              <LanguageSwitcher />
              {/* User avatar & dropdown */}
              <DropdownMenu.Root>
                <DropdownMenu.Trigger asChild>
                  <button
                    type="button"
                    className={cn(
                      "ml-2 flex h-8 w-8 items-center justify-center rounded-full",
                      "bg-[var(--brand-accent-light)] text-sm font-semibold text-[var(--brand-accent)]",
                      "hover:ring-2 hover:ring-[var(--brand-accent)]/30",
                      "focus-visible:outline-2 focus-visible:outline-offset-2",
                      "focus-visible:outline-[var(--brand-accent)]",
                      "cursor-pointer"
                    )}
                    aria-label={userName}
                  >
                    {session?.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={userName}
                        width={32}
                        height={32}
                        className="h-8 w-8 rounded-full object-cover"
                      />
                    ) : (
                      <span>{userName.charAt(0).toUpperCase()}</span>
                    )}
                  </button>
                </DropdownMenu.Trigger>

                <DropdownMenu.Portal>
                  <DropdownMenu.Content
                    className={cn(
                      "z-50 min-w-[14rem] rounded-[var(--radius-md)]",
                      "border border-[var(--border-default)] bg-[var(--surface-0)]",
                      "p-1 shadow-[var(--shadow-md)]",
                      "data-[state=open]:animate-in data-[state=closed]:animate-out",
                      "data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0",
                      "data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
                      "data-[side=bottom]:slide-in-from-top-2",
                      "data-[side=left]:slide-in-from-right-2",
                      "data-[side=right]:slide-in-from-left-2",
                      "data-[side=top]:slide-in-from-bottom-2"
                    )}
                    sideOffset={6}
                    align="end"
                  >
                    {session?.user ? (
                      <>
                        <div className="px-2 py-1.5 text-sm font-medium text-[var(--text-primary)]">
                          {userName}
                        </div>
                        <DropdownMenu.Separator className="my-1 h-px bg-[var(--border-default)]" />
                        <DropdownMenu.Item asChild>
                          <Link
                            href="/settings"
                            className={cn(
                              "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
                              "text-sm text-[var(--text-secondary)]",
                              "hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
                              "focus:bg-[var(--surface-1)] focus:text-[var(--text-primary)]",
                              "focus:outline-none cursor-pointer"
                            )}
                          >
                            <Settings className="h-4 w-4" aria-hidden="true" />
                            {t("settings")}
                          </Link>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item asChild>
                          <button
                            type="button"
                            onClick={() => signOut()}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
                              "text-sm text-[var(--text-secondary)]",
                              "hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
                              "focus:bg-[var(--surface-1)] focus:text-[var(--text-primary)]",
                              "focus:outline-none cursor-pointer"
                            )}
                          >
                            <LogOut className="h-4 w-4" aria-hidden="true" />
                            {t("signOut")}
                          </button>
                        </DropdownMenu.Item>
                      </>
                    ) : (
                      <>
                        <DropdownMenu.Item asChild>
                          <button
                            type="button"
                            onClick={() => signIn()}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
                              "text-sm text-[var(--text-secondary)]",
                              "hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
                              "focus:bg-[var(--surface-1)] focus:text-[var(--text-primary)]",
                              "focus:outline-none cursor-pointer"
                            )}
                          >
                            <LogIn className="h-4 w-4" aria-hidden="true" />
                            {t("signIn")}
                          </button>
                        </DropdownMenu.Item>
                        <DropdownMenu.Item asChild>
                          <Link
                            href="/settings"
                            className={cn(
                              "flex items-center gap-2 rounded-[var(--radius-sm)] px-2 py-1.5",
                              "text-sm text-[var(--text-secondary)]",
                              "hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
                              "focus:bg-[var(--surface-1)] focus:text-[var(--text-primary)]",
                              "focus:outline-none cursor-pointer"
                            )}
                          >
                            <Settings className="h-4 w-4" aria-hidden="true" />
                            {t("settings")}
                          </Link>
                        </DropdownMenu.Item>
                      </>
                    )}
                  </DropdownMenu.Content>
                </DropdownMenu.Portal>
              </DropdownMenu.Root>
            </div>

            {/* Mobile hamburger */}
            <button
              ref={mobileTriggerRef}
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-menu-panel"
              aria-label={t("openMenu")}
              data-testid="mobile-menu-trigger"
              className={cn(
                "inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)]",
                "text-[var(--text-secondary)] hover:bg-[var(--surface-1)]",
                "focus-visible:outline-2 focus-visible:outline-offset-2",
                "focus-visible:outline-[var(--brand-accent)]",
                "md:hidden"
              )}
            >
              <Menu className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        </div>

        {/* Modules mega-dropdown */}
        <ModulesDropdown
          isOpen={isModulesOpen}
          onClose={() => {
            setIsModulesOpen(false);
            modulesButtonRef.current?.focus();
          }}
          triggerRef={modulesButtonRef}
          activeHref={activeModulePath}
        />
      </header>

      {/* Mobile bottom sheet */}
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => {
          setIsMobileMenuOpen(false);
          mobileTriggerRef.current?.focus();
        }}
      />
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Layout — Header
   Top bar with page title, search, theme toggle, and language switcher.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { LanguageSwitcher, ThemeToggle } from "@/components/ui";
import { cn } from "@/lib/utils";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { Settings, LogIn, LogOut } from "lucide-react";
import { Link } from "@/i18n/navigation";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { data: session } = useSession();
  const t = useTranslations("nav");
  const userName = session?.user?.name || t("user");

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 items-center justify-between",
        "border-b border-[var(--border-default)]",
        "bg-[var(--surface-0)] px-4 lg:px-6",
        className
      )}
      data-testid="header"
    >
      {/* Left: breadcrumb / page context */}
      <div className="flex items-center gap-2 ml-12 lg:ml-0">
        <span className="text-sm text-[var(--text-tertiary)]">
          {userName}
        </span>
      </div>

      {/* Right: tools */}
      <div className="flex items-center gap-1">
        <LanguageSwitcher />
        <ThemeToggle />
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
              {userName.charAt(0).toUpperCase()}
            </button>
          </DropdownMenu.Trigger>

          <DropdownMenu.Portal>
            <DropdownMenu.Content
              className={cn(
                "z-50 min-w-[14rem] rounded-[var(--radius-md)]",
                "border border-[var(--border-default)] bg-[var(--surface-0)]",
                "p-1 shadow-[var(--shadow-md)]"
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
    </header>
  );
}

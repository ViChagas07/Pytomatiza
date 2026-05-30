/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — LanguageSwitcher
   Accessible dropdown to switch between supported locales.
   Uses next-intl navigation to avoid route stacking and 404s.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/config";
import { cn } from "@/lib/utils";

const localeLabels: Record<Locale, string> = {
  pt: "Português",
  en: "English",
  es: "Español",
  fr: "Français",
  de: "Deutsch",
  it: "Italiano",
  ru: "Русский",
  ja: "日本語",
  zh: "中文",
  ar: "العربية",
  hi: "हिन्दी",
};

interface LanguageSwitcherProps {
  className?: string;
  /** Render as icon + label button instead of select */
  variant?: "icon" | "select";
}

export function LanguageSwitcher({
  className,
  variant = "icon",
}: LanguageSwitcherProps) {
  const t = useTranslations("a11y");
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  /* Close on outside click & Escape */
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("click", handleClick);
      document.addEventListener("keydown", handleKey);
    }
    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  /**
   * Handle locale change — navigates to the same page path
   * under the new locale prefix using next-intl's router.
   */
  const handleLocaleChange = React.useCallback(
    (newLocale: Locale) => {
      // Use router.push for a proper navigation that triggers
      // the locale layout to re-render with new messages.
      router.push(pathname, { locale: newLocale });
      setOpen(false);
    },
    [router, pathname]
  );

  if (variant === "select") {
    return (
      <select
        value={currentLocale}
        onChange={(e) => {
          const loc = e.target.value as Locale;
          router.push(pathname, { locale: loc });
        }}
        aria-label={t("languageSwitcher")}
        data-testid="language-switcher-select"
        className={cn(
          "h-9 rounded-[var(--radius-md)] border border-[var(--border-default)]",
          "bg-[var(--surface-0)] px-2 text-sm text-[var(--text-primary)]",
          "focus-visible:outline-2 focus-visible:outline-offset-1",
          "focus-visible:outline-[var(--brand-accent)]",
          className
        )}
      >
        {locales.map((loc) => (
          <option key={loc} value={loc}>
            {localeLabels[loc]}
          </option>
        ))}
      </select>
    );
  }

  return (
    <div ref={dropdownRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={t("languageSwitcher")}
        data-testid="language-switcher"
        className={cn(
          "inline-flex h-10 w-10 items-center justify-center",
          "rounded-[var(--radius-md)]",
          "text-[var(--text-secondary)] hover:bg-[var(--surface-2)]",
          "hover:text-[var(--text-primary)] transition-colors",
          "focus-visible:outline-2 focus-visible:outline-offset-2",
          "focus-visible:outline-[var(--brand-accent)]"
        )}
      >
        <Globe className="h-5 w-5" aria-hidden="true" />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-label={t("languageSwitcher")}
          className={cn(
            "absolute right-0 top-full z-50 mt-1 w-44",
            "overflow-hidden rounded-[var(--radius-md)]",
            "border border-[var(--border-default)]",
            "bg-[var(--surface-0)] shadow-[var(--shadow-md)]",
            "py-1"
          )}
        >
          {locales.map((loc) => (
            <li key={loc} role="option" aria-selected={loc === currentLocale}>
              <button
                type="button"
                onClick={() => handleLocaleChange(loc)}
                className={cn(
                  "flex w-full items-center gap-2 px-3 py-2 text-sm",
                  "text-[var(--text-primary)] hover:bg-[var(--surface-1)]",
                  "transition-colors text-left",
                  loc === currentLocale &&
                    "bg-[var(--brand-accent-light)] font-semibold"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-2 w-2 rounded-full",
                    loc === currentLocale
                      ? "bg-[var(--brand-accent)]"
                      : "bg-transparent"
                  )}
                  aria-hidden="true"
                />
                {localeLabels[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

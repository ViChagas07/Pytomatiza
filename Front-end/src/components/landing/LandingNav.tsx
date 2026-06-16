"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const t = useTranslations("landing");
  const { data: session } = useSession();
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const navLinks = [
    { href: "#features", label: t("nav.features") },
    { href: "#how-it-works", label: t("nav.howItWorks") },
  ];

  return (
    <header
      className={cn(
        "fixed top-0 z-50 h-14 w-full border-b border-[var(--border-default)]",
        scrolled ? "bg-[var(--surface-0)]/85 backdrop-blur-[8px]" : "bg-[var(--surface-0)]"
      )}
      role="banner"
    >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 lg:px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image
            src="/Pytomatiza_Logo_Supremo.png"
            alt=""
            width={36}
            height={36}
            className="rounded-[var(--radius-sm)]"
            aria-hidden="true"
          />
          <span className="text-[var(--brand-python-blue)]" style={{ fontFamily: "var(--font-aref-ruqaa)" }}>
            Pytomatiza
          </span>
          <span className="-ml-2 text-[var(--brand-accent-dynamic)]">+</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex" aria-label={t("a11y.mainNavigation")}>
          {navLinks.map(({ href, label }) => (
            <Link
              key={href}
              href={href}
              className="text-sm font-medium text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {session?.user ? (
            <Link href="/dashboard">
              <Button variant="secondary" size="sm">
                {session.user.name?.charAt(0) ?? "U"}
              </Button>
            </Link>
          ) : (
            <Button variant="ghost" size="sm" onClick={() => signIn()}>
              {t("nav.signIn")}
            </Button>
          )}
          <Link href="/auth/signup">
            <Button variant="primary" size="sm">
              {t("nav.getStarted")}
            </Button>
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((p) => !p)}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
          className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)] md:hidden"
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-[var(--border-default)] bg-[var(--surface-0)] md:hidden">
          <nav className="flex flex-col gap-2 p-4" aria-label={t("a11y.mobileNavigation")}>
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className="rounded-[var(--radius-md)] px-3 py-2 text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]"
              >
                {label}
              </Link>
            ))}
            <hr className="my-2 border-[var(--border-default)]" />
            {session?.user ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  {t("nav.dashboard")}
                </Button>
              </Link>
            ) : (
              <Button variant="ghost" size="sm" className="w-full" onClick={() => { signIn(); setMobileOpen(false); }}>
                {t("nav.signIn")}
              </Button>
            )}
            <Link href="/auth/signup" onClick={() => setMobileOpen(false)}>
              <Button variant="primary" size="sm" className="w-full">
                {t("nav.getStarted")}
              </Button>
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

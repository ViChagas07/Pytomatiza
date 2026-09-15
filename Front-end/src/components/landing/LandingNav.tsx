"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Menu, X, LayoutDashboard, ArrowUp } from "lucide-react";
import { useSession, signIn } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

export function LandingNav() {
  const t = useTranslations("landing");
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;
  const [scrolled, setScrolled] = React.useState(false);
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [pastHero, setPastHero] = React.useState(false);

  React.useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Show floating controls only after passing the Hero section ── */
  React.useEffect(() => {
    const hero = document.getElementById("hero-heading");
    const section = hero?.closest("section");
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: "0px 0px -8% 0px", threshold: 0 }
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const navLinks = [
    { href: "#features", label: t("nav.features") },
    { href: "#how-it-works", label: t("nav.howItWorks") },
  ];

  return (
    <>
      <header
        className={cn(
          "fixed top-0 z-50 h-14 w-full border-b border-[var(--border-default)]",
          scrolled ? "bg-[var(--surface-0)]/85 backdrop-blur-[8px]" : "bg-[var(--surface-0)]"
        )}
        role="banner"
      >
      <div className="mx-auto flex h-full max-w-7xl items-center justify-between px-4 lg:px-6">
        {/* Logo — compact on mobile, full on desktop */}
        <Link href={isLoggedIn ? "/dashboard" : "/"} className="flex items-center gap-2 shrink-0">
          <Image
            src="/Pytomatiza_Logo_Supremo.png"
            alt=""
            width={36}
            height={36}
            className="rounded-[var(--radius-sm)]"
            aria-hidden="true"
          />
          <span className="hidden sm:inline text-lg font-bold tracking-tight text-[var(--brand-python-blue)]" style={{ fontFamily: "var(--font-aref-ruqaa)" }}>
            Pytomatiza
          </span>
          <span className="hidden sm:inline -ml-2 text-lg font-bold text-[var(--brand-accent-dynamic)]">+</span>
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
          {isLoggedIn && (
            <Link href="/dashboard">
              {session.user.image ? (
                <Image
                  src={session.user.image}
                  alt={session.user.name || t("nav.dashboard")}
                  width={32}
                  height={32}
                  className="h-8 w-8 rounded-full object-cover ring-2 ring-[var(--border-default)] hover:ring-[var(--brand-accent)]/50 transition-all"
                />
              ) : (
                <Button variant="secondary" size="sm">
                  {session.user.name?.charAt(0).toUpperCase() ?? "U"}
                </Button>
              )}
            </Link>
          )}
          <Link href={isLoggedIn ? "/dashboard" : "/login"}>
            <Button variant="primary" size="sm" className="!text-black font-bold inline-flex items-center gap-1">
              {isLoggedIn && <LayoutDashboard className="h-3.5 w-3.5" />}
              {isLoggedIn ? t("nav.dashboard") : t("nav.getStarted")}
            </Button>
          </Link>
        </div>

        {/* Mobile right side: CTA button + hamburger */}
        <div className="flex items-center gap-2 md:hidden">
          <Link
            href={isLoggedIn ? "/dashboard" : "/login"}
            className={cn(
              "text-[11px] font-bold rounded-[var(--radius-md)] bg-[var(--brand-accent)] text-black px-3 py-1.5 hover:bg-[var(--brand-accent-hover)] transition-all duration-300 whitespace-nowrap inline-flex items-center gap-1",
              pastHero && !mobileOpen
                ? "opacity-100 translate-y-0"
                : "opacity-0 -translate-y-2 pointer-events-none"
            )}
            aria-hidden={!pastHero || mobileOpen}
            tabIndex={pastHero && !mobileOpen ? 0 : -1}
          >
            {isLoggedIn && <LayoutDashboard className="h-3.5 w-3.5" />}
            {isLoggedIn ? t("nav.dashboard") : t("nav.getStarted") || "Começar agora"}
          </Link>
          <button
            type="button"
            onClick={() => setMobileOpen((p) => !p)}
            aria-expanded={mobileOpen}
            aria-label={mobileOpen ? t("a11y.closeMenu") : t("a11y.openMenu")}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] text-[var(--text-secondary)] hover:bg-[var(--surface-1)]"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
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
            {isLoggedIn ? (
              <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button variant="secondary" size="sm" className="w-full">
                  {t("nav.dashboard")}
                </Button>
              </Link>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                className="w-full bg-[var(--brand-accent)]/10 text-[var(--brand-accent)] font-semibold hover:bg-[var(--brand-accent)]/20"
                onClick={() => { signIn(); setMobileOpen(false); }}
              >
                {t("nav.signIn")}
              </Button>
            )}
          </nav>
        </div>
      )}
      </header>

      {/* ── Scroll-to-top floating button (mobile) ─────────────────── */}
      <button
        type="button"
        onClick={scrollToTop}
        aria-label={t("a11y.scrollToTop")}
        className={cn(
          "fixed bottom-4 right-4 z-40 inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-accent)] text-black shadow-[var(--shadow-md)] transition-all duration-300 md:hidden",
          pastHero
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-3 pointer-events-none"
        )}
        aria-hidden={!pastHero}
        tabIndex={pastHero ? 0 : -1}
      >
        <ArrowUp className="h-5 w-5" aria-hidden="true" />
      </button>
    </>
  );
}

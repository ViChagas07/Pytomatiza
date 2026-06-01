/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — Login Page
   Full-screen background image (Pytomatiza_Login_Bg.png) +
   centered form card with form image background.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { SkipLink } from "@/components/ui/SkipLink";
import { AuthForm } from "@/components/auth";
import { LanguageSwitcher } from "@/components/ui/LanguageSwitcher";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Link } from "@/i18n/navigation";
import { locales } from "@/i18n/config";

/* ── Props ────────────────────────────────────────────────────────── */

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

/* ── generateMetadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.login" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/login`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/login`])
      ),
    },
    robots: {
      index: false, // Auth pages should not be indexed
      follow: false,
    },
  };
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "a11y" });

  return (
    <>
      <SkipLink />

      {/* ── Full-screen background image ────────────────────────── */}
      <div className="fixed inset-0 -z-10" aria-hidden="true">
        <Image
          src="/Pytomatiza_Login_Bg.png"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
          quality={85}
        />
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-black/45" />
      </div>

      {/* ── Floating top bar: logo (L) + tools (R) ──────────────── */}
      <header className="relative z-20 flex h-16 w-full items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Logo + brand name — clickable → home */}
        <Link
          href="/"
          aria-label={t("a11y.goToHome")}
          className="flex items-center gap-2 rounded-[var(--radius-sm)] text-lg font-bold tracking-tight transition-opacity hover:opacity-85 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-sm)] bg-white/15 backdrop-blur-sm">
            <Image
              src="/Pytomatiza_Logo_Supremo.png"
              alt=""
              width={28}
              height={28}
              className="rounded-[3px]"
              aria-hidden="true"
            />
          </div>
          <span className="text-white" style={{ fontFamily: "var(--font-aref-ruqaa)" }}>
            Pytomatiza
          </span>
          <span className="-ml-2 text-base text-[var(--brand-accent-dynamic)]">+</span>
        </Link>

        {/* Language + Theme toggles — white over dark bg */}
        <div className="flex items-center gap-1">
          <LanguageSwitcher className="text-white/80 hover:text-white hover:bg-white/10" />
          <ThemeToggle className="text-white/80 hover:text-white hover:bg-white/10" />
        </div>
      </header>

      {/* ── Main content: centered form card ─────────────────────── */}
      <main
        id="main-content"
        tabIndex={-1}
        className="relative z-10 flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-6 md:py-12"
      >
        <AuthForm />
      </main>
    </>
  );
}

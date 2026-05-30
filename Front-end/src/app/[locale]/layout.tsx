/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Locale Layout
   Validates the [locale] segment, binds the request locale for SSR,
   and provides i18n messages to all client components.
   ═══════════════════════════════════════════════════════════════════ */

import { type ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { locales, type Locale, rtlLocales } from "@/i18n/config";
import { LocaleUpdater } from "@/components/layout/LocaleUpdater";
import { AppearanceSync } from "@/components/layout/AppearanceSync";

/* ── generateStaticParams ─────────────────────────────────────────── */

export function generateStaticParams(): { locale: Locale }[] {
  return locales.map((locale) => ({ locale }));
}

/* ── Layout ───────────────────────────────────────────────────────── */

interface LocaleLayoutProps {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Bind the locale for server-side rendering and static generation.
  // This is CRITICAL for next-intl to correctly resolve translations.
  setRequestLocale(locale);

  // Load messages for the current locale
  const messages = await getMessages();

  const isRtl = rtlLocales.includes(locale as Locale);

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <LocaleUpdater locale={locale} isRtl={isRtl} />
      <AppearanceSync />
      {children}
    </NextIntlClientProvider>
  );
}

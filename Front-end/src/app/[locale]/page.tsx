/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Landing Page
   Premium SaaS marketing page — describes the platform, its value
   proposition, and drives users to sign up / explore.
   ═══════════════════════════════════════════════════════════════════ */

import { setRequestLocale } from "next-intl/server";
import { getTranslations } from "next-intl/server";
import { LandingPage } from "@/components/landing/LandingPage";

interface LandingRootPageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: LandingRootPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "landing" });

  return {
    title: `Pytomatiza+ — ${t("hero.title")}`,
    description: t("hero.subtitle"),
    openGraph: {
      title: `Pytomatiza+ — ${t("hero.title")}`,
      description: t("hero.subtitle"),
      type: "website",
      locale,
    },
    twitter: {
      card: "summary_large_image",
      title: `Pytomatiza+ — ${t("hero.title")}`,
      description: t("hero.subtitle"),
    },
    robots: {
      index: true,
      follow: true,
    },
    alternates: {
      languages: {
        pt: "/pt",
        en: "/en",
        es: "/es",
        fr: "/fr",
        de: "/de",
        it: "/it",
        ru: "/ru",
        ja: "/ja",
        zh: "/zh",
        ar: "/ar",
        hi: "/hi",
      },
    },
  };
}

export default async function LandingRootPage({ params }: LandingRootPageProps) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <LandingPage />;
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Privacy Policy + Terms of Use — Server Page
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { PrivacyContent } from "@/components/legal/PrivacyContent";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "meta.privacy" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      type: "website",
      locale: locale === "pt" ? "pt_BR" : locale,
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
    },
  };
}

export default async function PrivacyPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  return <PrivacyContent />;
}

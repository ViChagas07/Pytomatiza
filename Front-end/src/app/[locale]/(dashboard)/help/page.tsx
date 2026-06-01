/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Help & Support Page
   FAQ, documentation links, and contact support.
   ═══════════════════════════════════════════════════════════════════ */

import { type Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { HelpCircle, Book, MessageCircle, ExternalLink } from "lucide-react";
import { locales } from "@/i18n/config";

/* ── Props ────────────────────────────────────────────────────────── */

interface HelpPageProps {
  params: Promise<{ locale: string }>;
}

/* ── generateMetadata ─────────────────────────────────────────────── */

export async function generateMetadata({
  params,
}: HelpPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.help" });

  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: `/${locale}/help`,
      languages: Object.fromEntries(
        locales.map((l) => [l, `/${l}/help`])
      ),
    },
  };
}

/* ── Page ─────────────────────────────────────────────────────────── */

export default async function HelpPage({ params }: HelpPageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "help" });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)] flex items-center gap-2">
          <HelpCircle className="h-6 w-6" aria-hidden="true" />
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* Quick links */}
      <div className="grid gap-6 sm:grid-cols-2">
        <a
          href="https://docs.pytomatiza.com"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-start gap-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
            <Book className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)] flex items-center gap-1">
              {t("documentation")}
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {t("documentationDescription")}
            </p>
          </div>
        </a>

        <a
          href="mailto:support@pytomatiza.com"
          className="flex items-start gap-6 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)] transition-colors hover:bg-[var(--surface-1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
            <MessageCircle className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              {t("contactSupport")}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              {t("contactSupportDescription")}
            </p>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          {t("faqTitle")}
        </h2>
        <dl className="space-y-6">
          {[
            { q: t("faq0.question"), a: t("faq0.answer") },
            { q: t("faq1.question"), a: t("faq1.answer") },
            { q: t("faq2.question"), a: t("faq2.answer") },
            { q: t("faq3.question"), a: t("faq3.answer") },
          ].map(({ q, a }) => (
            <div key={q}>
              <dt className="text-sm font-medium text-[var(--text-primary)]">
                {q}
              </dt>
              <dd className="text-xs text-[var(--text-secondary)] mt-1">
                {a}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

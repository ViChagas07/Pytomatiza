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

/* ── FAQ items ────────────────────────────────────────────────────── */

const faqItems = [
  {
    question: "How do I create an automation?",
    answer: 'Go to the Automations page and use the Natural Language Workflow Builder. Describe what you want to automate in plain English, and Pytomatiza+ will build the workflow for you.',
  },
  {
    question: "How do I connect a new integration?",
    answer: "Navigate to Settings → Integrations to connect third-party services like Google Workspace, Slack, or GitHub.",
  },
  {
    question: "What happens if an agent fails?",
    answer: "Failed agents are marked with an error status. You can view the error details in the agent card and retry the execution.",
  },
  {
    question: "How do I change my language?",
    answer: "Click the globe icon in the header to switch between 9 supported languages.",
  },
];

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
              Documentation
              <ExternalLink className="h-3 w-3" aria-hidden="true" />
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Browse guides, tutorials, and API references.
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
              Contact Support
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mt-1">
              Get help from our team. Usually responds within 24 hours.
            </p>
          </div>
        </a>
      </div>

      {/* FAQ */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Frequently Asked Questions
        </h2>
        <dl className="space-y-6">
          {faqItems.map(({ question, answer }) => (
            <div key={question}>
              <dt className="text-sm font-medium text-[var(--text-primary)]">
                {question}
              </dt>
              <dd className="text-xs text-[var(--text-secondary)] mt-1">
                {answer}
              </dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}

"use client";

import { useTranslations } from "next-intl";
import {
  ArrowRight,
  CheckCircle2,
  GitBranch,
  BarChart3,
  FileText,
  TrendingUp,
  Mail,
  FileSpreadsheet,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function HighlightSection() {
  const t = useTranslations("landing");

  return (
    <section
      id="highlights"
      aria-labelledby="highlights-heading"
      className="relative py-16 md:py-24"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/4 left-1/2 h-[36rem] w-[60rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,120,60,0.10),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="highlights-heading"
            className="text-3xl font-bold md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("highlights.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("highlights.subtitle")}
          </p>
        </div>

        <div className="mt-16 space-y-16 md:space-y-24">
          <HighlightBlock
            title={t("highlights.block1.title")}
            description={t("highlights.block1.description")}
            checks={[
              t("highlights.block1.check1"),
              t("highlights.block1.check2"),
              t("highlights.block1.check3"),
            ]}
            cta={t("highlights.learnMore")}
            mockup={<InvoiceMockup />}
          />
          <HighlightBlock
            title={t("highlights.block2.title")}
            description={t("highlights.block2.description")}
            checks={[
              t("highlights.block2.check1"),
              t("highlights.block2.check2"),
              t("highlights.block2.check3"),
            ]}
            cta={t("highlights.learnMore")}
            mockup={<ReportMockup />}
            reversed
          />
        </div>
      </div>
    </section>
  );
}

interface HighlightBlockProps {
  title: string;
  description: string;
  checks: string[];
  cta: string;
  mockup: React.ReactNode;
  reversed?: boolean;
}

function HighlightBlock({ title, description, checks, cta, mockup, reversed }: HighlightBlockProps) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <div className={reversed ? "lg:order-2" : ""}>
        <h3
          className="text-2xl font-bold md:text-3xl"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {title}
        </h3>
        <p className="mt-4 text-base text-[var(--text-secondary)]">
          {description}
        </p>

        <ul className="mt-6 space-y-3">
          {checks.map((check) => (
            <li key={check} className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
              <span className="text-sm text-[var(--text-primary)]">{check}</span>
            </li>
          ))}
        </ul>

        <Link href="/login" className="mt-8 inline-flex">
          <Button variant="outline" size="md">
            {cta}
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Button>
        </Link>
      </div>

      <div className={reversed ? "lg:order-1" : ""}>
        <div className="relative">
          <div className="absolute inset-0 -z-10 scale-105 rounded-[var(--radius-lg)] bg-[radial-gradient(circle,rgba(255,140,70,0.20),rgba(255,180,60,0.08)_45%,transparent_70%)] blur-2xl" aria-hidden="true" />
          {mockup}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MOCKUPS — Reaproveita os cenários de "Processamento de Faturas PDF"
   e "Relatório Semanal de Vendas" em blocos visuais.
   ═══════════════════════════════════════════════════════════════════ */

function InvoiceMockup() {
  const chips = [
    { label: "Gmail", color: "#EA4335" },
    { label: "OCR", color: "#8B5CF6" },
    { label: "Drive", color: "#4285F4" },
    { label: "Slack", color: "#4A154B" },
  ];

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
        <GitBranch className="h-4 w-4 text-[var(--brand-accent)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">Processamento de Faturas PDF</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
          <CheckCircle2 className="h-2.5 w-2.5" /> Ativo
        </span>
      </div>

      <div className="mt-4 space-y-2.5">
        {[
          "E-mail com PDF recebido",
          "Extração de dados (OCR)",
          "Salvar no Google Drive",
          "Notificar equipe no Slack",
        ].map((step, i) => (
          <div key={step} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2.5">
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--brand-accent-light)] text-[10px] font-bold text-[var(--brand-accent)]">
              {i + 1}
            </span>
            <span className="text-xs text-[var(--text-primary)]">{step}</span>
            {i === 1 && <FileText className="ml-auto h-3.5 w-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />}
          </div>
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {chips.map((chip, i) => (
          <span key={chip.label} className="inline-flex items-center gap-1">
            {i > 0 && <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" aria-hidden="true" />}
            <span className="rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-medium text-white" style={{ backgroundColor: chip.color }}>
              {chip.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

function ReportMockup() {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-md)]">
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] pb-3">
        <BarChart3 className="h-4 w-4 text-[var(--brand-accent)]" />
        <span className="text-sm font-semibold text-[var(--text-primary)]">Relatório Semanal de Vendas</span>
        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-[var(--brand-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--brand-accent)]">
          <TrendingUp className="h-2.5 w-2.5" /> Agendado
        </span>
      </div>

      {/* Mini bar chart */}
      <div className="mt-4 flex h-24 items-end gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
        {[35, 55, 40, 70, 60, 90, 100].map((h, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-sm bg-gradient-to-t from-[var(--brand-python-blue)]/30 to-[var(--brand-accent)]/70"
            style={{ height: `${h}%` }}
          />
        ))}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-1.5">
        {[
          { label: "Sheets", icon: FileSpreadsheet },
          { label: "IA Gemini", icon: TrendingUp },
          { label: "E-mail", icon: Mail },
        ].map((chip, i) => (
          <span key={chip.label} className="inline-flex items-center gap-1">
            {i > 0 && <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" aria-hidden="true" />}
            <span className="inline-flex items-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-secondary)]">
              <chip.icon className="h-3 w-3" aria-hidden="true" />
              {chip.label}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

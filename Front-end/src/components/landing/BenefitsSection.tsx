"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2, XCircle } from "lucide-react";

const withoutItems = [
  "benefits.without.manual",
  "benefits.without.errors",
  "benefits.without.delays",
  "benefits.without.silos",
  "benefits.without.visibility",
];

const withItems = [
  "benefits.with.automation",
  "benefits.with.accuracy",
  "benefits.with.speed",
  "benefits.with.integration",
  "benefits.with.insights",
];

export function BenefitsSection() {
  const t = useTranslations("landing");

  return (
    <section
      aria-labelledby="benefits-heading"
      className="relative overflow-hidden py-16 md:py-24"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute bottom-0 left-1/2 h-[24rem] w-[44rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.08),transparent_65%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="benefits-heading"
            className="text-3xl font-bold md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("benefits.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("benefits.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-1)]/50 p-7">
            <h3 className="mb-6 text-lg font-semibold text-[var(--text-secondary)]">{t("benefits.withoutTitle")}</h3>
            <ul className="space-y-4">
              {withoutItems.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-danger)]/70" aria-hidden="true" />
                  <span className="text-sm text-[var(--text-secondary)]">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--brand-accent)]/30 bg-[var(--brand-accent-light)]/30 p-7 shadow-[var(--shadow-sm)]">
            <div className="absolute -top-12 -right-12 h-36 w-36 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.16),transparent_70%)] blur-xl pointer-events-none" aria-hidden="true" />
            <h3 className="relative mb-6 text-lg font-semibold text-[var(--brand-accent-dynamic)]">{t("benefits.withTitle")}</h3>
            <ul className="relative space-y-4">
              {withItems.map((key) => (
                <li key={key} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-[var(--color-success)]" aria-hidden="true" />
                  <span className="text-sm text-[var(--text-primary)]">{t(key)}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

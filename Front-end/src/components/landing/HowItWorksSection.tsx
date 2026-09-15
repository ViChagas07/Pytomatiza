"use client";

import { useTranslations } from "next-intl";
import { FileText, Cpu, Play } from "lucide-react";

const icons = [FileText, Cpu, Play];

export function HowItWorksSection() {
  const t = useTranslations("landing");

  return (
    <section
      id="how-it-works"
      aria-labelledby="how-it-works-heading"
      className="relative overflow-hidden py-16 md:py-24"
    >
      {/* ── Subtle section glow ─────────────────────────────────── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-1/3 left-1/2 h-[24rem] w-[40rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.08),transparent_65%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("howItWorks.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 md:grid-cols-3 md:gap-8">
          {[1, 2, 3].map((step) => {
            const Icon = icons[step - 1];
            return (
              <article
                key={step}
                className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]/80 p-7 shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[var(--brand-accent)]/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-1"
              >
                <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.12),transparent_70%)] blur-xl pointer-events-none" aria-hidden="true" />

                <div className="mb-5 flex items-center justify-between">
                  <div className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)] transition-colors group-hover:bg-[var(--brand-accent)]/20">
                    <Icon className="h-6 w-6 text-[var(--brand-accent)]" aria-hidden="true" />
                  </div>
                  <span className="text-4xl font-bold text-[var(--text-tertiary)]/30 transition-colors group-hover:text-[var(--brand-accent)]/40">
                    {String(step).padStart(2, "0")}
                  </span>
                </div>

                <h3 className="text-lg font-semibold">{t(`howItWorks.step${step}.title`)}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{t(`howItWorks.step${step}.description`)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

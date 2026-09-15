"use client";

import { useTranslations } from "next-intl";
import { DollarSign, FileBarChart, Mail, Globe, Table, Building2 } from "lucide-react";

const icons = [DollarSign, FileBarChart, Mail, Globe, Table, Building2];

export function UseCasesSection() {
  const t = useTranslations("landing");

  return (
    <section
      aria-labelledby="use-cases-heading"
      className="relative overflow-hidden py-16 md:py-24"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 left-[-5%] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.08),transparent_65%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="use-cases-heading"
            className="text-3xl font-bold md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("useCases.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("useCases.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const Icon = icons[i - 1];
            return (
              <article
                key={i}
                className="group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]/80 p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[var(--brand-accent)]/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
              >
                <div className="absolute -top-10 -right-10 h-28 w-28 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.10),transparent_70%)] blur-xl pointer-events-none" aria-hidden="true" />
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)] transition-colors group-hover:bg-[var(--brand-accent)]/20">
                  <Icon className="h-6 w-6 text-[var(--brand-accent)]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{t(`useCases.case${i}.title`)}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{t(`useCases.case${i}.description`)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

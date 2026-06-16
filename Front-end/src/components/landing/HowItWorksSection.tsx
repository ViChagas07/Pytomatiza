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
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="how-it-works-heading"
            className="text-3xl font-bold md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("howItWorks.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("howItWorks.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-8 md:grid-cols-3">
          {[1, 2, 3].map((step) => {
            const Icon = icons[step - 1];
            return (
              <article key={step} className="relative rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)]">
                <span className="absolute -top-3 -left-3 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-accent)] text-sm font-bold text-[var(--brand-accent-foreground)]">
                  {step}
                </span>
                <div className="mb-4 mt-2 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
                  <Icon className="h-6 w-6 text-[var(--brand-accent)]" aria-hidden="true" />
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

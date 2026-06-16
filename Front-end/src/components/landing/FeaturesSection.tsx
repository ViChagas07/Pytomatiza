"use client";

import { useTranslations } from "next-intl";
import { Brain, Link, Clock, Activity, FileText, BarChart3 } from "lucide-react";

const icons = [Brain, Link, Clock, Activity, FileText, BarChart3];

export function FeaturesSection() {
  const t = useTranslations("landing");

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="py-16 md:py-24"
    >
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="features-heading"
            className="text-3xl font-bold md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("features.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const Icon = icons[i - 1];
            return (
              <article
                key={i}
                className="group rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)] transition-all duration-200 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)] transition-colors group-hover:bg-[var(--brand-accent)]/20">
                  <Icon className="h-6 w-6 text-[var(--brand-accent)]" aria-hidden="true" />
                </div>
                <h3 className="text-lg font-semibold">{t(`features.feature${i}.title`)}</h3>
                <p className="mt-2 text-sm text-[var(--text-secondary)]">{t(`features.feature${i}.description`)}</p>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

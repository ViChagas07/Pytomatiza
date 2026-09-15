"use client";

import { useTranslations } from "next-intl";
import { Brain, Link, Clock, Activity, FileText, BarChart3 } from "lucide-react";

const icons = [Brain, Link, Clock, Activity, FileText, BarChart3];

/* Asymmetric bento layout on lg (6-col grid):
   card 1 tall (3×2), cards 2-3 wide (3×1), cards 4-6 small (2×1) */
const spans = [
  "lg:col-span-3 lg:row-span-2", // 1 — large tall card
  "lg:col-span-3", // 2
  "lg:col-span-3", // 3
  "lg:col-span-2", // 4
  "lg:col-span-2", // 5
  "lg:col-span-2", // 6
];

export function FeaturesSection() {
  const t = useTranslations("landing");

  return (
    <section
      id="features"
      aria-labelledby="features-heading"
      className="relative overflow-hidden py-16 md:py-24"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-[-5%] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.08),transparent_65%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="features-heading"
            className="text-3xl font-bold md:text-4xl lg:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("features.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("features.subtitle")}
          </p>
        </div>

        <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-6">
          {[1, 2, 3, 4, 5, 6].map((i) => {
            const Icon = icons[i - 1];
            return (
              <article
                key={i}
                className={`group relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]/80 p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-[var(--brand-accent)]/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 sm:col-span-1 ${spans[i - 1]} ${i === 1 ? "lg:p-8" : ""}`}
              >
                <div className="absolute -bottom-12 -left-12 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.10),transparent_70%)] blur-xl pointer-events-none" aria-hidden="true" />

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

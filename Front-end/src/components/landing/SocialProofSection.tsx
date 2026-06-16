"use client";

import { useTranslations } from "next-intl";
import { AnimatedCounter } from "./AnimatedCounter";

export function SocialProofSection() {
  const t = useTranslations("landing");

  const stats = [
    { end: 500000, suffix: "+", label: t("socialProof.executions") },
    { end: 15000, suffix: "+", label: t("socialProof.companies") },
    { end: 99.9, suffix: "%", label: t("socialProof.uptime"), duration: 2500 },
    { end: 500, suffix: "+", label: t("socialProof.integrations") },
  ];

  return (
    <section aria-labelledby="social-proof-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <h2 id="social-proof-heading" className="text-center text-sm font-semibold uppercase tracking-widest text-[var(--text-secondary)]">
          {t("socialProof.title")}
        </h2>
        <div className="mt-10 grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <AnimatedCounter key={stat.label} {...stat} />
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — Brand Panel
   Decorative left panel on desktop. Pure CSS + SVG, no images.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import Image from "next/image";
import { Zap, Workflow, Shield } from "lucide-react";

export function BrandPanel() {
  const t = useTranslations("brand");
  return (
    <div
      className="relative hidden h-full flex-col overflow-hidden bg-[var(--brand-accent)] p-12 lg:flex"
      aria-hidden="true"
    >
      {/* Subtle decorative circles */}
      <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-[var(--brand-primary-dark)] opacity-40" />
      <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[var(--brand-primary-dark)] opacity-30" />

      {/* Logo & Tagline */}
      <div className="relative z-10 mt-12">
        <div className="mb-4 inline-flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-[var(--radius-md)] bg-white/20">
            <Image
              src="/Pytomatiza_Logo_Supremo.png"
              alt=""
              width={44}
              height={44}
              className="rounded-[var(--radius-sm)]"
              aria-hidden="true"
            />
          </div>
          <span className="text-2xl font-bold tracking-tight text-[var(--brand-accent-foreground)]" style={{ fontFamily: "var(--font-aref-ruqaa)" }}>
            Pytomatiza<span className="-ml-1 text-[var(--brand-accent-foreground)]/70">+</span>
          </span>
        </div>
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-[var(--brand-accent-foreground)]/80">
          {t("tagline")}
        </p>
      </div>

      {/* Feature highlights */}
      <div className="relative z-10 mt-auto space-y-5">
        {[
          { icon: Zap, titleKey: "feature1Title", descKey: "feature1Desc" },
          { icon: Workflow, titleKey: "feature2Title", descKey: "feature2Desc" },
          { icon: Shield, titleKey: "feature3Title", descKey: "feature3Desc" },
        ].map(({ icon: Icon, titleKey, descKey }) => (
          <div key={titleKey} className="flex gap-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white/15">
              <Icon className="h-4 w-4 text-[var(--brand-accent-foreground)]" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-[var(--brand-accent-foreground)]">{t(titleKey)}</p>
              <p className="text-xs leading-relaxed text-[var(--brand-accent-foreground)]/65">{t(descKey)}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

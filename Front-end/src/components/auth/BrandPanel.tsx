/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Auth — Brand Panel
   Decorative left panel on desktop. Pure CSS + SVG, no images.
   ═══════════════════════════════════════════════════════════════════ */

import Image from "next/image";
import { Zap, Workflow, Shield } from "lucide-react";

export function BrandPanel() {
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
          <span className="text-2xl font-bold tracking-tight text-white" style={{ fontFamily: "var(--font-aref-ruqaa)" }}>
            Pytomatiza<span className="-ml-1 text-[var(--brand-accent-dynamic)]">+</span>
          </span>
        </div>
        <p className="mt-6 max-w-sm text-lg leading-relaxed text-white/80">
          AI-powered automation that thinks, learns, and executes &mdash; so you
          don&apos;t have to.
        </p>
      </div>

      {/* Feature highlights */}
      <div className="relative z-10 mt-auto space-y-5">
        {[
          {
            icon: Zap,
            title: "Natural Language Workflows",
            desc: "Describe tasks in plain English. Our NLP engine builds the automation for you.",
          },
          {
            icon: Workflow,
            title: "Multi-Agent Orchestration",
            desc: "Specialized AI agents collaborate to handle complex, multi-step processes.",
          },
          {
            icon: Shield,
            title: "Enterprise-Grade Security",
            desc: "End-to-end encryption, role-based access, and full audit trails.",
          },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex gap-4">
            <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white/15">
              <Icon className="h-4 w-4 text-white" aria-hidden="true" />
            </div>
            <div>
              <p className="text-sm font-semibold text-white">{title}</p>
              <p className="text-xs leading-relaxed text-white/65">{desc}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

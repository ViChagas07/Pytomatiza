"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Bot, TrendingUp, Zap } from "lucide-react";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  const t = useTranslations("landing");
  const { data: session } = useSession();

  return (
    <section aria-labelledby="cta-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-python-blue-dark,#2E5F8A)] to-[var(--brand-python-blue)] p-8 md:p-14">
          {/* ── Ambient glow ────────────────────────────────────── */}
          <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
            <div className="absolute top-[-30%] right-[-10%] h-80 w-80 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.35),transparent_60%)] blur-2xl" />
            <div className="absolute bottom-[-30%] left-[-10%] h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(255,180,60,0.30),transparent_60%)] blur-2xl" />
          </div>

          <div className="relative grid items-center gap-10 lg:grid-cols-2">
            <div>
              <h2
                id="cta-heading"
                className="text-3xl font-bold text-white md:text-4xl lg:text-5xl"
                style={{ fontFamily: "var(--font-display)" }}
              >
                {t("cta.title")}
              </h2>
              <p className="mt-4 max-w-lg text-white/80">
                {t("cta.subtitle")}
              </p>
              <div className="mt-8">
                <Link href={session?.user ? "/dashboard" : "/login"}>
                  <Button
                    variant="primary"
                    size="lg"
                    className="bg-white text-[var(--brand-python-blue)] hover:bg-white/90"
                  >
                    {t("cta.button")}
                    <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* ── Mini mockup beside the CTA ────────────────────── */}
            <div className="hidden lg:block">
              <div className="rounded-[var(--radius-lg)] border border-white/15 bg-black/25 p-5 shadow-[var(--shadow-md)] backdrop-blur-sm">
                <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-accent)]" />
                  <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
                  <span className="ml-3 text-[10px] text-white/50">app.pytomatiza.com/dashboard</span>
                </div>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {[
                    { label: "Agentes", value: "8", Icon: Bot, color: "#FFD43B" },
                    { label: "Sucesso", value: "98%", Icon: TrendingUp, color: "#1d9e75" },
                    { label: "Hoje", value: "47", Icon: Zap, color: "#e8732e" },
                  ].map((stat) => (
                    <div key={stat.label} className="rounded-[var(--radius-md)] border border-white/10 p-3">
                      <stat.Icon className="h-4 w-4" style={{ color: stat.color }} aria-hidden="true" />
                      <div className="mt-2 text-lg font-bold text-white">{stat.value}</div>
                      <div className="text-[10px] text-white/60">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

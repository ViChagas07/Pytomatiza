"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Sparkles } from "lucide-react";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  const t = useTranslations("landing");
  const { data: session } = useSession();
  const isLoggedIn = !!session?.user;

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-20 pb-16 md:pt-28 md:pb-24"
    >
      {/* ── Ambient radial glow (dark + warm, RedSun-inspired) ──── */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-15%] left-1/2 h-[42rem] w-[42rem] -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,120,60,0.18),transparent_60%)] blur-2xl" />
        <div className="absolute bottom-[-20%] right-[-10%] h-[32rem] w-[32rem] rounded-full bg-[radial-gradient(circle,rgba(255,180,60,0.14),transparent_60%)] blur-2xl" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,rgba(55,118,171,0.16),transparent_60%)] blur-2xl" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid items-center gap-14 lg:grid-cols-2 lg:gap-16">
          <div className="text-center sm:text-left">
            {/* ── "What's New" style badge ──────────────────────── */}
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-default)] bg-[var(--surface-0)]/70 py-1 pl-2 pr-3 text-xs font-medium text-[var(--text-secondary)] shadow-[var(--shadow-xs)] backdrop-blur-sm">
              <span className="inline-flex items-center rounded-full bg-[var(--brand-accent)]/15 px-2 py-0.5 text-[var(--brand-accent-dynamic)]">
                <Sparkles className="mr-1 h-3 w-3" aria-hidden="true" />
                {t("hero.badge")}
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
            </div>

            <h1
              id="hero-heading"
              className="mt-6 text-4xl leading-[1.1] font-bold tracking-tight md:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("hero.title")}
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-lg text-[var(--text-secondary)] sm:mx-0 md:text-xl">
              {t("hero.subtitle")}
            </p>

            {/* ── Dual CTAs ────────────────────────────────────── */}
            <div className="mt-9 flex flex-col items-center gap-3 sm:flex-row sm:justify-start">
              <Link href={isLoggedIn ? "/dashboard" : "/login"}>
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  {isLoggedIn ? t("nav.dashboard") : t("hero.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto"
                onClick={() => {
                  const el = document.getElementById("highlights");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {t("hero.demo")}
              </Button>
            </div>
          </div>

          <div
            className="relative"
            aria-label={t("a11y.heroIllustration")}
            role="img"
          >
            <DashboardMockup />
          </div>
        </div>
      </div>
    </section>
  );
}

function DashboardMockup() {
  return (
    <div className="relative mx-auto w-full max-w-lg min-h-[220px] sm:aspect-[4/3]">
      {/* ── Glow halo behind the mockup ─────────────────────────── */}
      <div className="absolute inset-0 -z-10 scale-110 rounded-[var(--radius-lg)] bg-[radial-gradient(circle,rgba(255,140,70,0.28),rgba(255,180,60,0.10)_45%,transparent_70%)] blur-2xl" aria-hidden="true" />

      <div className="absolute inset-0 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-python-blue)]/10 to-[var(--brand-accent)]/10 shadow-[var(--shadow-md)] backdrop-blur-sm border border-[var(--border-default)] overflow-hidden">
        <div className="flex h-full flex-col">
          {/* Browser chrome */}
          <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-2.5">
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-accent)]" />
            <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
            <span className="ml-3 text-[10px] text-[var(--text-tertiary)]">app.pytomatiza.com/dashboard</span>
          </div>

          <div className="flex flex-1 overflow-hidden">
            {/* Mini sidebar */}
            <div className="hidden w-14 flex-col items-center gap-3 border-r border-[var(--border-default)] py-3 sm:flex">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="h-7 w-7 rounded-[var(--radius-sm)] bg-[var(--surface-2)] flex items-center justify-center">
                  <div className="h-3 w-3 rounded-sm bg-[var(--text-tertiary)]/40" />
                </div>
              ))}
            </div>

            {/* Dashboard content */}
            <div className="flex flex-1 flex-col gap-2.5 p-3 overflow-hidden">
              {/* Welcome */}
              <div className="flex items-center justify-between">
                <div>
                  <div className="h-3 w-20 rounded bg-[var(--surface-2)]" />
                  <div className="mt-1 h-2 w-28 rounded bg-[var(--surface-2)]" />
                </div>
                <div className="h-5 w-12 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: "8", label: "Agentes", color: "bg-[var(--brand-accent)]" },
                  { value: "47", label: "Automações", color: "bg-[var(--color-success)]" },
                  { value: "98%", label: "Sucesso", color: "bg-[var(--color-warning)]" },
                  { value: "3", label: "Pendentes", color: "bg-[var(--brand-python-blue)]" },
                ].map((kpi) => (
                  <div key={kpi.label} className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-2">
                    <div className="flex items-center gap-1.5">
                      <div className={`h-2 w-2 rounded-full ${kpi.color}`} />
                      <span className="text-[9px] text-[var(--text-tertiary)]">{kpi.label}</span>
                    </div>
                    <div className="mt-1 text-sm font-bold text-[var(--text-primary)]">{kpi.value}</div>
                  </div>
                ))}
              </div>

              {/* Activity feed */}
              <div className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] p-2 flex flex-col gap-1.5">
                <div className="text-[9px] font-medium text-[var(--text-tertiary)]">Atividade recente</div>
                {[
                  { name: "Processamento de Faturas", time: "09:45", status: "running" },
                  { name: "Relatório Semanal", time: "07:00", status: "idle" },
                ].map((a) => (
                  <div key={a.name} className="flex items-center gap-1.5">
                    <div className={`h-1.5 w-1.5 rounded-full ${a.status === "running" ? "bg-[var(--color-success)]" : "bg-[var(--text-tertiary)]"}`} />
                    <span className="text-[9px] text-[var(--text-primary)] truncate flex-1">{a.name}</span>
                    <span className="text-[8px] text-[var(--text-tertiary)]">{a.time}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -top-3 -right-3 h-24 w-24 rounded-full bg-[radial-gradient(circle,rgba(255,140,70,0.5),transparent_70%)] blur-xl animate-pulse pointer-events-none" style={{ animationDuration: "4s" }} />
      <div className="absolute -bottom-2 -left-2 h-20 w-20 rounded-full bg-[radial-gradient(circle,rgba(55,118,171,0.5),transparent_70%)] blur-xl animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
    </div>
  );
}

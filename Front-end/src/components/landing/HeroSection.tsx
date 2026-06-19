"use client";

import { useTranslations } from "next-intl";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function HeroSection() {
  const t = useTranslations("landing");

  return (
    <section
      aria-labelledby="hero-heading"
      className="relative overflow-hidden pt-24 pb-16 md:pt-32 md:pb-24"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-[var(--brand-accent-light)]/30 to-transparent pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] h-[60%] w-[60%] rounded-full bg-[var(--brand-accent)]/5 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] h-[50%] w-[50%] rounded-full bg-[var(--brand-python-blue)]/5 blur-3xl pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <div>
            <h1
              id="hero-heading"
              className="text-4xl leading-tight font-bold tracking-tight md:text-5xl lg:text-6xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("hero.title")}
            </h1>
            <p className="mt-4 text-lg text-[var(--text-secondary)] md:text-xl">
              {t("hero.subtitle")}
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button
                variant="primary"
                size="lg"
                onClick={() => {
                  const el = document.getElementById("demo-section");
                  el?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                <Play className="h-4 w-4" aria-hidden="true" />
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

      <div className="absolute -top-3 -right-3 h-24 w-24 rounded-full bg-[var(--brand-accent)]/10 blur-xl animate-pulse pointer-events-none" style={{ animationDuration: "4s" }} />
      <div className="absolute -bottom-2 -left-2 h-20 w-20 rounded-full bg-[var(--brand-python-blue)]/10 blur-xl animate-pulse pointer-events-none" style={{ animationDuration: "5s" }} />
    </div>
  );
}

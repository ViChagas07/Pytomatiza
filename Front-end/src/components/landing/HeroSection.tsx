"use client";

import { useTranslations } from "next-intl";
import { ArrowRight, Play } from "lucide-react";
import { Link } from "@/i18n/navigation";
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
              <Link href="/login">
                <Button variant="primary" size="lg">
                  {t("hero.cta")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </Link>
              <Button variant="outline" size="lg">
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
    <div className="relative mx-auto aspect-[4/3] w-full max-w-lg">
      <div className="absolute inset-0 rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-python-blue)]/10 to-[var(--brand-accent)]/10 shadow-[var(--shadow-md)] backdrop-blur-sm border border-[var(--border-default)] overflow-hidden">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-[var(--border-default)] px-4 py-2">
            <div className="flex items-center gap-2">
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-accent)]" />
              <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
            </div>
            <div className="flex gap-1.5">
              <div className="h-6 w-16 rounded-[var(--radius-sm)] bg-[var(--surface-2)]" />
              <div className="h-6 w-6 rounded-full bg-[var(--brand-accent)]/30" />
              <div className="h-6 w-6 rounded-full bg-[var(--brand-python-blue)]/30" />
            </div>
          </div>

          <div className="flex flex-1">
            <div className="hidden w-20 flex-col gap-2 border-r border-[var(--border-default)] p-3 sm:flex">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-4 rounded-[var(--radius-sm)] bg-[var(--surface-2)]"
                  style={{ width: `${60 - i * 8}%` }}
                />
              ))}
            </div>

            <div className="flex flex-1 flex-col gap-3 p-4">
              <div className="grid grid-cols-3 gap-3">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3"
                  >
                    <div className="h-2 w-12 rounded bg-[var(--surface-2)]" />
                    <div className="mt-2 h-6 w-full rounded bg-gradient-to-r from-[var(--brand-accent)]/40 to-[var(--brand-accent)]/10" />
                  </div>
                ))}
              </div>

              <div className="flex flex-1 gap-3">
                <div className="flex-1 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
                  <div className="mb-2 h-2 w-16 rounded bg-[var(--surface-2)]" />
                  <div className="flex items-end gap-1 h-16">
                    {[40, 65, 35, 80, 50, 90, 45].map((h, i) => (
                      <div
                        key={i}
                        className="flex-1 rounded-[var(--radius-sm)] bg-gradient-to-t from-[var(--brand-accent)]/50 to-[var(--brand-accent)]/20"
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                </div>
                <div className="w-28 rounded-[var(--radius-md)] border border-[var(--border-default)] p-3 hidden sm:block">
                  <div className="mb-2 h-2 w-12 rounded bg-[var(--surface-2)]" />
                  <div className="space-y-2">
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
                        <div className="h-2 flex-1 rounded bg-[var(--surface-2)]" />
                      </div>
                    ))}
                  </div>
                </div>
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

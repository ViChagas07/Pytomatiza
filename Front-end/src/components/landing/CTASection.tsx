"use client";

import { useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import { useSession } from "next-auth/react";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/Button";

export function CTASection() {
  const t = useTranslations("landing");
  const { data: session } = useSession();

  return (
    <section aria-labelledby="cta-heading" className="py-16 md:py-24">
      <div className="mx-auto max-w-4xl px-4 lg:px-6">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] bg-gradient-to-br from-[var(--brand-python-blue)] to-[var(--brand-python-blue-dark,#2E5F8A)] p-8 text-center md:p-16">
          <div className="absolute inset-0 bg-[var(--brand-accent)]/5 pointer-events-none" />
          <div className="absolute top-[-20%] right-[-10%] h-40 w-40 rounded-full bg-[var(--brand-accent)]/10 blur-2xl pointer-events-none" />
          <div className="absolute bottom-[-20%] left-[-10%] h-40 w-40 rounded-full bg-[var(--brand-accent)]/10 blur-2xl pointer-events-none" />

          <div className="relative">
            <h2
              id="cta-heading"
              className="text-3xl font-bold text-white md:text-4xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t("cta.title")}
            </h2>
            <p className="mx-auto mt-4 max-w-lg text-[var(--brand-accent-light)]/80">
              {t("cta.subtitle")}
            </p>
            <div className="mt-8 flex justify-center">
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
        </div>
      </div>
    </section>
  );
}

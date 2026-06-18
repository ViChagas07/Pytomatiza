"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const productLinks = ["footer.product.features", "footer.product.pricing", "footer.product.integrations", "footer.product.changelog"];
const resourceLinks = ["footer.resources.docs", "footer.resources.api", "footer.resources.blog", "footer.resources.help"];
const companyLinks = ["footer.company.about", "footer.company.careers", "footer.company.blog", "footer.company.contact"];
const legalLinks = ["footer.legal.privacy", "footer.legal.terms", "footer.legal.cookies", "footer.legal.security"];

const columns = [
  { title: "footer.product.title", links: productLinks },
  { title: "footer.resources.title", links: resourceLinks },
  { title: "footer.company.title", links: companyLinks },
  { title: "footer.legal.title", links: legalLinks },
];

export function LandingFooter() {
  const t = useTranslations("landing");

  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface-0)] py-12 md:py-16" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-10 md:grid-cols-5">
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
              <Image
                src="/Pytomatiza_Logo_Supremo.png"
                alt=""
                width={32}
                height={32}
                className="rounded-[var(--radius-sm)]"
                aria-hidden="true"
              />
              <span className="text-[var(--brand-python-blue)]" style={{ fontFamily: "var(--font-aref-ruqaa)" }}>
                Pytomatiza
              </span>
              <span className="-ml-2 text-[var(--brand-accent-dynamic)]">+</span>
            </Link>
            <p className="mt-4 text-sm text-[var(--text-secondary)] leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t(col.title)}</h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((key) => {
                  const href = key.includes("privacy") || key.includes("terms") || key.includes("cookies") || key.includes("security")
                    ? "/privacy-policy"
                    : "#";
                  return (
                    <li key={key}>
                      <Link
                        href={href}
                        className="text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                      >
                        {t(key)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 border-t border-[var(--border-default)] pt-6 text-center text-sm text-[var(--text-tertiary)]">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}

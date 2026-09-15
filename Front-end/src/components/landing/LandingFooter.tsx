"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

function GithubGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.09.68-.22.68-.49v-1.7c-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.63.07-.62.07-.62 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.7 0 0 .84-.28 2.75 1.05a9.36 9.36 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.4.2 2.44.1 2.7.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.8-4.57 5.06.36.32.68.94.68 1.9v2.81c0 .27.18.59.69.49A10.02 10.02 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

function LinkedinGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5ZM3 9h4v12H3V9Zm7 0h3.8v1.7h.05c.53-1 1.83-2.06 3.77-2.06 4.03 0 4.78 2.65 4.78 6.1V21h-4v-5.5c0-1.31-.02-3-1.83-3-1.83 0-2.11 1.43-2.11 2.9V21h-4V9Z" />
    </svg>
  );
}

function InstagramGlyph({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const resourceLinks = ["footer.resources.docs", "footer.resources.api", "footer.resources.blog", "footer.resources.help"];
const legalLinks = ["footer.legal.privacy", "footer.legal.terms", "footer.legal.cookies", "footer.legal.security"];

const socialLinks = [
  { key: "footer.social.github", Icon: GithubGlyph, href: "https://github.com/ViChagas07" },
  { key: "footer.social.linkedin", Icon: LinkedinGlyph, href: "https://www.linkedin.com/in/alisson-davi-0819242a7/" },
  { key: "footer.social.instagram", Icon: InstagramGlyph, href: "https://www.instagram.com/vi_chagas7/" },
];

const columns = [
  { title: "footer.resources.title", links: resourceLinks },
  { title: "footer.legal.title", links: legalLinks },
];

export function LandingFooter() {
  const t = useTranslations("landing");

  return (
    <footer className="border-t border-[var(--border-default)] bg-[var(--surface-0)] py-12 md:py-16" role="contentinfo">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
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
            <p className="mt-4 max-w-xs text-sm text-[var(--text-secondary)] leading-relaxed">
              {t("footer.description")}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 md:col-span-2 md:grid-cols-3">
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

            <div className="col-span-2 md:col-span-1">
              <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("footer.social.title")}</h3>
              <ul className="mt-4 space-y-3">
                {socialLinks.map(({ key, Icon, href }) => (
                  <li key={key}>
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] transition-colors hover:text-[var(--text-primary)]"
                    >
                      <Icon className="h-4 w-4" aria-hidden="true" />
                      {t(key)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-[var(--border-default)] pt-6 text-center text-sm text-[var(--text-tertiary)]">
          {t("footer.copyright")}
        </div>
      </div>
    </footer>
  );
}

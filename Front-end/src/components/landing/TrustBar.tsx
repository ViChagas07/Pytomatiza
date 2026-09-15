"use client";

import { useTranslations } from "next-intl";
import {
  GmailGlyph,
  DriveGlyph,
  SheetsGlyph,
  SlackGlyph,
  TwitterGlyph,
} from "./IntegrationIcons";

const integrations = [
  { name: "Gmail", Icon: GmailGlyph },
  { name: "Google Drive", Icon: DriveGlyph },
  { name: "Google Sheets", Icon: SheetsGlyph },
  { name: "Slack", Icon: SlackGlyph },
  { name: "Twitter", Icon: TwitterGlyph },
];

export function TrustBar() {
  const t = useTranslations("landing");

  return (
    <section aria-label={t("trust.label")} className="py-10 md:py-12">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <p className="text-center text-sm font-medium text-[var(--text-tertiary)]">
          {t("trust.label")}
        </p>
        <div className="mt-7 flex flex-wrap items-center justify-center gap-x-10 gap-y-5">
          {integrations.map(({ name, Icon }) => (
            <div
              key={name}
              title={name}
              className="flex items-center gap-2 text-[var(--text-tertiary)] opacity-70 grayscale transition-all duration-200 hover:opacity-100 hover:grayscale-0 hover:text-[var(--text-secondary)]"
            >
              <Icon className="h-6 w-6" />
              <span className="text-sm font-semibold">{name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ — IntegrationPanel
   Zapier/n8n‑inspired connector grid with real icons, health status,
   capability catalog, and "coming soon" cards for future integrations.

   All user-facing text is sourced from the `integrationPanel` namespace.
   Service/category identity is stable (service key + category key);
   only icon and brand color stay as static metadata.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import {
  SiDiscord,
  SiTelegram,
  SiWhatsapp,
  SiFacebook,
  SiTrello,
  SiJira,
  SiSlack,
  SiZoom,
  SiGooglephotos,
} from "react-icons/si";
import { FaInstagram, FaLinkedin, FaMicrosoft, FaCalendar, FaMapLocation, FaVideo } from "react-icons/fa6";
import { GoogleDriveIcon, GmailIcon } from "@/components/ui/GoogleIcons";

/* ── Adapters — Google SVG icons to react‑icons interface ──────── */

function GoogleDriveIconAdapter({ size = 24, className = "" }: { size?: number | string; className?: string; color?: string }) {
  const s = typeof size === "number" ? size : 24;
  return (
    <span className={className} style={{ width: s, height: s, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <GoogleDriveIcon className="h-full w-full" />
    </span>
  );
}
function GmailIconAdapter({ size = 24, className = "" }: { size?: number | string; className?: string; color?: string }) {
  const s = typeof size === "number" ? size : 24;
  return (
    <span className={className} style={{ width: s, height: s, display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
      <GmailIcon className="h-full w-full" />
    </span>
  );
}
import {
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  Globe,
  CheckCircle,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

/* ── Static integration metadata (identity only — no copy) ──────── */

type IconComponent = React.ComponentType<{ className?: string; color?: string; size?: number | string }>;

interface IntegrationMeta {
  /** Stable service key — matches `integrationPanel.services.<service>` */
  service: string;
  icon: IconComponent;
  color: string;
}

const INTEGRATIONS: IntegrationMeta[] = [
  { service: "discord", icon: SiDiscord, color: "#5865F2" },
  { service: "telegram", icon: SiTelegram, color: "#26A5E4" },
  { service: "trello", icon: SiTrello, color: "#0052CC" },
  { service: "jira", icon: SiJira, color: "#0052CC" },
  { service: "google_drive", icon: GoogleDriveIconAdapter, color: "#4285F4" },
  { service: "gmail", icon: GmailIconAdapter, color: "#EA4335" },
  { service: "google_calendar", icon: FaCalendar, color: "#4285F4" },
  { service: "google_photos", icon: SiGooglephotos, color: "#4285F4" },
  { service: "google_maps", icon: FaMapLocation, color: "#EA4335" },
  { service: "slack", icon: SiSlack, color: "#4A154B" },
  { service: "zoom", icon: SiZoom, color: "#2D8CFF" },
  { service: "google_meet", icon: FaVideo, color: "#00897B" },
];

const FUTURE_INTEGRATIONS: IntegrationMeta[] = [
  { service: "facebook", icon: SiFacebook, color: "#1877F2" },
  { service: "whatsapp", icon: SiWhatsapp, color: "#25D366" },
  { service: "instagram", icon: FaInstagram, color: "#E4405F" },
  { service: "linkedin", icon: FaLinkedin, color: "#0A66C2" },
  { service: "teams", icon: FaMicrosoft, color: "#6264A7" },
];

/* ── Component ───────────────────────────────────────────────────── */

export function IntegrationPanel() {
  const t = useTranslations("integrationPanel");

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
            <Zap className="h-4 w-4 text-[var(--brand-accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            {t("title")}
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          {t("subtitle")}
        </p>
      </div>

      {/* ── Active Integration Cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((int, i) => (
          <IntegrationCard
            key={int.service}
            integration={int}
            index={i}
          />
        ))}
      </div>

      {/* ── Capability Catalog ───────────────────────────────────── */}
      <CapabilityCatalog integrations={INTEGRATIONS} />

      {/* ── Serviços Futuros ──────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("futureTitle")}
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FUTURE_INTEGRATIONS.map((int) => (
            <div
              key={int.service}
              className="relative group rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-0)]/60 p-5 opacity-50 hover:opacity-70 transition-all duration-300 cursor-not-allowed select-none"
            >
              <div className="absolute -top-2 -right-2">
                <span className="inline-flex items-center rounded-full bg-[var(--surface-2)] border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                  {t("comingSoonBadge")}
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-1)]">
                  <int.icon size={22} color={int.color} className="opacity-60" />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">
                  {t(`services.${int.service}.label`)}
                </span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                {t("futureDescription")}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── Integration Card ────────────────────────────────────────────── */

function IntegrationCard({
  integration,
  index,
}: {
  integration: IntegrationMeta;
  index: number;
}) {
  const t = useTranslations("integrationPanel");
  const service = integration.service;
  const capabilities = t.raw(`services.${service}.capabilities`) as string[] | undefined;

  return (
    <div
      className={cn(
        "group relative rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300",
        "hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Badge "Disponível" */}
      <div className="absolute -top-2 -right-2">
        <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 text-[var(--color-success)] text-xs px-2 py-0.5 rounded-full font-medium">
          <CheckCircle className="h-2.5 w-2.5" />
          {t("availableBadge")}
        </span>
      </div>

      {/* Icon + Name */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] transition-colors duration-300"
          style={{ backgroundColor: `${integration.color}15` }}
        >
          <integration.icon size={24} color={integration.color} />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">
            {t(`services.${service}.label`)}
          </h4>
          <p className="text-[11px] text-[var(--text-tertiary)]">
            {t(`categories.${t(`services.${service}.category`)}`)}
          </p>
        </div>
      </div>

      {/* Capabilities */}
      <ul className="space-y-1 mb-3">
        {(capabilities ?? []).slice(0, 3).map((cap) => (
          <li key={cap} className="flex items-center gap-1.5 text-[11px] text-[var(--text-secondary)]">
            <ArrowRight className="h-3 w-3 shrink-0 text-[var(--text-tertiary)]" />
            {cap}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── Capability Catalog ──────────────────────────────────────────── */

function CapabilityCatalog({ integrations }: { integrations: IntegrationMeta[] }) {
  const t = useTranslations("integrationPanel");

  // Group by stable category key (services.<s>.category), preserving order.
  const categories: string[] = [];
  for (const int of integrations) {
    const categoryKey = t(`services.${int.service}.category`);
    if (!categories.includes(categoryKey)) categories.push(categoryKey);
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          {t("catalogTitle")}
        </h3>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const items = integrations.filter(
            (i) => t(`services.${i.service}.category`) === cat
          );
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-[var(--text-tertiary)]" />
                {t(`categories.${cat}`)}
              </p>
              <ul className="space-y-1.5">
                {items.map((item) => {
                  const capabilities =
                    (t.raw(`services.${item.service}.capabilities`) as string[] | undefined) ?? [];
                  return (
                    <li key={item.service} className="flex items-start gap-2">
                      <div className="mt-0.5 shrink-0">
                        <item.icon size={14} color={item.color} />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">
                          {t(`services.${item.service}.label`)}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-0.5">
                          {capabilities.map((cap) => (
                            <span key={cap} className="inline-flex items-center rounded-full bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                              {cap}
                            </span>
                          ))}
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

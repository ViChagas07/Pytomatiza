/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ — IntegrationChips
   Componente reutilizável que exibe duas seções de serviços:
     1. Integrações Disponíveis (badge verde)
     2. Serviços Futuros (badge "Em breve" + cursor-not-allowed)
   Usado em todas as páginas de atividade (Comunicação, Documentos,
   Dados, Arquivos, Mídia).
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import {
  SiDiscord,
  SiTelegram,
  SiTrello,
  SiJira,
  SiSlack,
  SiZoom,
  SiGooglephotos,
  SiFacebook,
  SiWhatsapp,
} from "react-icons/si";
import { FaCalendar, FaMapLocation, FaVideo, FaInstagram, FaLinkedin, FaMicrosoft } from "react-icons/fa6";
import { GoogleDriveIcon, GmailIcon } from "@/components/ui/GoogleIcons";
import { CheckCircle, Clock } from "lucide-react";
import { useTranslations } from "next-intl";

/* ── Service definitions ────────────────────────────────────────── */

interface ServiceDef {
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  color: string;
  labelKey: string; // translation key
}

const AVAILABLE_SERVICES: ServiceDef[] = [
  { icon: SiDiscord, color: "#5865F2", labelKey: "discord" },
  { icon: SiTelegram, color: "#26A5E4", labelKey: "telegram" },
  { icon: SiTrello, color: "#0052CC", labelKey: "trello" },
  { icon: SiJira, color: "#0052CC", labelKey: "jira" },
  { icon: GoogleDriveIcon as React.ComponentType<{ size?: number; color?: string; className?: string }>, color: "#4285F4", labelKey: "googleDrive" },
  { icon: GmailIcon as React.ComponentType<{ size?: number; color?: string; className?: string }>, color: "#EA4335", labelKey: "gmail" },
  { icon: FaCalendar, color: "#4285F4", labelKey: "googleCalendar" },
  { icon: SiGooglephotos, color: "#4285F4", labelKey: "googlePhotos" },
  { icon: FaMapLocation, color: "#EA4335", labelKey: "googleMaps" },
  { icon: SiSlack, color: "#4A154B", labelKey: "slack" },
  { icon: SiZoom, color: "#2D8CFF", labelKey: "zoom" },
  { icon: FaVideo, color: "#00897B", labelKey: "googleMeet" },
];

const FUTURE_SERVICES: ServiceDef[] = [
  { icon: SiFacebook, color: "#1877F2", labelKey: "facebookPages" },
  { icon: SiWhatsapp, color: "#25D366", labelKey: "whatsappBusiness" },
  { icon: FaInstagram, color: "#E4405F", labelKey: "instagram" },
  { icon: FaLinkedin, color: "#0A66C2", labelKey: "linkedin" },
  { icon: FaMicrosoft, color: "#6264A7", labelKey: "microsoftTeams" },
];

/* ── Component ──────────────────────────────────────────────────── */

export function IntegrationChips() {
  const t = useTranslations("integrationChips");

  return (
    <div className="space-y-6">
      {/* ── Integrações Disponíveis ──────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
          {t("availableTitle")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SERVICES.map((svc) => (
            <div
              key={svc.labelKey}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
            >
              <svc.icon size={14} color={svc.color} />
              <span className="text-xs text-white/70">{t(svc.labelKey)}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-success)] ml-1 font-medium">
                <CheckCircle className="h-2.5 w-2.5" />
                {t("availableBadge")}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Serviços Futuros ─────────────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
          {t("futureTitle")}
        </h3>
        <div className="flex flex-wrap gap-2">
          {FUTURE_SERVICES.map((svc) => (
            <div
              key={svc.labelKey}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 opacity-40 grayscale cursor-not-allowed"
            >
              <svc.icon size={14} color={svc.color} />
              <span className="text-xs text-white/50">{t(svc.labelKey)}</span>
              <span className="text-[10px] text-white/30 ml-1">{t("comingSoonBadge")}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

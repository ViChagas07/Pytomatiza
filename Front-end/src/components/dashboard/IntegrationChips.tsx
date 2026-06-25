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

/* ── Service definitions ────────────────────────────────────────── */

interface ServiceDef {
  icon: React.ComponentType<{ size?: number; color?: string; className?: string }>;
  color: string;
  label: string;
}

const AVAILABLE_SERVICES: ServiceDef[] = [
  { icon: SiDiscord, color: "#5865F2", label: "Discord" },
  { icon: SiTelegram, color: "#26A5E4", label: "Telegram" },
  { icon: SiTrello, color: "#0052CC", label: "Trello" },
  { icon: SiJira, color: "#0052CC", label: "Jira" },
  { icon: GoogleDriveIcon as React.ComponentType<{ size?: number; color?: string; className?: string }>, color: "#4285F4", label: "Google Drive" },
  { icon: GmailIcon as React.ComponentType<{ size?: number; color?: string; className?: string }>, color: "#EA4335", label: "Gmail" },
  { icon: FaCalendar, color: "#4285F4", label: "Google Calendar" },
  { icon: SiGooglephotos, color: "#4285F4", label: "Google Photos" },
  { icon: FaMapLocation, color: "#EA4335", label: "Google Maps" },
  { icon: SiSlack, color: "#4A154B", label: "Slack" },
  { icon: SiZoom, color: "#2D8CFF", label: "Zoom" },
  { icon: FaVideo, color: "#00897B", label: "Google Meet" },
];

const FUTURE_SERVICES: ServiceDef[] = [
  { icon: SiFacebook, color: "#1877F2", label: "Facebook Pages" },
  { icon: SiWhatsapp, color: "#25D366", label: "WhatsApp Business" },
  { icon: FaInstagram, color: "#E4405F", label: "Instagram" },
  { icon: FaLinkedin, color: "#0A66C2", label: "LinkedIn" },
  { icon: FaMicrosoft, color: "#6264A7", label: "Microsoft Teams" },
];

/* ── Component ──────────────────────────────────────────────────── */

export function IntegrationChips() {
  return (
    <div className="space-y-6">
      {/* ── Integrações Disponíveis ──────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 text-[var(--color-success)]" />
          Integrações Disponíveis
        </h3>
        <div className="flex flex-wrap gap-2">
          {AVAILABLE_SERVICES.map((svc) => (
            <div
              key={svc.label}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1"
            >
              <svc.icon size={14} color={svc.color} />
              <span className="text-xs text-white/70">{svc.label}</span>
              <span className="inline-flex items-center gap-0.5 text-[10px] text-[var(--color-success)] ml-1 font-medium">
                <CheckCircle className="h-2.5 w-2.5" />
                Disponível
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Serviços Futuros ─────────────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
          <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
          Serviços Futuros
        </h3>
        <div className="flex flex-wrap gap-2">
          {FUTURE_SERVICES.map((svc) => (
            <div
              key={svc.label}
              className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 opacity-40 grayscale cursor-not-allowed"
            >
              <svc.icon size={14} color={svc.color} />
              <span className="text-xs text-white/50">{svc.label}</span>
              <span className="text-[10px] text-white/30 ml-1">Em breve</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

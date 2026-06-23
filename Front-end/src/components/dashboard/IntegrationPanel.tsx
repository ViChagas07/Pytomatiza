/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ — IntegrationPanel
   Zapier/n8n‑inspired connector grid with real icons, health status,
   capability catalog, and "coming soon" cards for future integrations.
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
import { cn } from "@/lib/utils";

/* ── Static integration metadata ────────────────────────────────── */

interface IntegrationMeta {
  service: string;
  label: string;
  icon: React.ComponentType<{ className?: string; color?: string; size?: number | string }>;
  color: string;
  category: string;
  capabilities: string[];
}

const INTEGRATIONS: IntegrationMeta[] = [
  {
    service: "discord", label: "Discord", icon: SiDiscord, color: "#5865F2",
    category: "Comunicação",
    capabilities: ["Enviar mensagens", "Enviar alertas", "Criar notificações via webhook"],
  },
  {
    service: "telegram", label: "Telegram", icon: SiTelegram, color: "#26A5E4",
    category: "Comunicação",
    capabilities: ["Enviar mensagens", "Enviar documentos", "Enviar fotos", "Notificar usuários"],
  },
  {
    service: "trello", label: "Trello", icon: SiTrello, color: "#0052CC",
    category: "Gestão de Projetos",
    capabilities: ["Criar cards", "Mover cards entre listas", "Atualizar cards"],
  },
  {
    service: "jira", label: "Jira", icon: SiJira, color: "#0052CC",
    category: "Gestão de Projetos",
    capabilities: ["Criar issues / bugs / tasks", "Atualizar tickets", "Comentar em issues"],
  },
  {
    service: "google_drive", label: "Google Drive", icon: GoogleDriveIconAdapter, color: "#4285F4",
    category: "Armazenamento",
    capabilities: ["Upload de arquivos", "Criar pastas", "Buscar arquivos", "Listar arquivos"],
  },
  {
    service: "gmail", label: "Gmail", icon: GmailIconAdapter, color: "#EA4335",
    category: "Comunicação",
    capabilities: ["Enviar e-mails", "Listar mensagens", "Ler e-mails", "Buscar por remetente"],
  },
  {
    service: "google_calendar", label: "Google Calendar", icon: FaCalendar, color: "#4285F4",
    category: "Produtividade",
    capabilities: ["Listar eventos", "Criar eventos", "Gerenciar calendários"],
  },
  {
    service: "google_photos", label: "Google Photos", icon: SiGooglephotos, color: "#4285F4",
    category: "Armazenamento",
    capabilities: ["Armazenar fotos", "Criar álbuns", "Buscar por data", "Compartilhar mídia"],
  },
  {
    service: "google_maps", label: "Google Maps", icon: FaMapLocation, color: "#EA4335",
    category: "Utilitários",
    capabilities: ["Geocodificar endereços", "Geocodificação reversa", "Calcular rotas"],
  },
  {
    service: "slack", label: "Slack", icon: SiSlack, color: "#4A154B",
    category: "Comunicação",
    capabilities: ["Enviar mensagens em canais", "Listar canais", "Notificar equipes"],
  },
  {
    service: "zoom", label: "Zoom", icon: SiZoom, color: "#2D8CFF",
    category: "Comunicação",
    capabilities: ["Criar reuniões", "Listar reuniões", "Agendar webinars"],
  },
  {
    service: "google_meet", label: "Google Meet", icon: FaVideo, color: "#00897B",
    category: "Comunicação",
    capabilities: ["Criar videochamadas", "Listar reuniões", "Agendar com Google Meet"],
  },
];

const FUTURE_INTEGRATIONS = [
  { service: "facebook", label: "Facebook Pages", icon: SiFacebook, color: "#1877F2" as const },
  { service: "whatsapp", label: "WhatsApp Business", icon: SiWhatsapp, color: "#25D366" as const },
  { service: "instagram", label: "Instagram", icon: FaInstagram, color: "#E4405F" as const },
  { service: "linkedin", label: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" as const },
  { service: "teams", label: "Microsoft Teams", icon: FaMicrosoft, color: "#6264A7" as const },
];

/* ── Component ───────────────────────────────────────────────────── */

export function IntegrationPanel() {
  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* ── Header ──────────────────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
            <Zap className="h-4 w-4 text-[var(--brand-accent)]" />
          </div>
          <h2 className="text-lg font-semibold text-[var(--text-primary)]">
            Integrações Disponíveis
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mt-1">
          Conecte o Pytomatiza+ aos seus serviços favoritos.
          Workflows podem utilizar qualquer integração conectada.
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
            Serviços Futuros
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
                  Em breve
                </span>
              </div>
              <div className="flex items-center gap-3 mb-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--surface-1)]">
                  <int.icon size={22} color={int.color} className="opacity-60" />
                </div>
                <span className="text-sm font-medium text-[var(--text-secondary)]">{int.label}</span>
              </div>
              <p className="text-[11px] text-[var(--text-tertiary)] leading-relaxed">
                Esta integração será adicionada em versões futuras do Pytomatiza+.
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
          Disponível
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
          <h4 className="text-sm font-semibold text-[var(--text-primary)]">{integration.label}</h4>
          <p className="text-[11px] text-[var(--text-tertiary)]">{integration.category}</p>
        </div>
      </div>

      {/* Capabilities */}
      <ul className="space-y-1 mb-3">
        {integration.capabilities.slice(0, 3).map((cap) => (
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
  const categories = [...new Set(integrations.map((i) => i.category))];

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)]">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" />
        <h3 className="text-sm font-semibold text-[var(--text-primary)]">
          O que o Pytomatiza+ pode automatizar hoje
        </h3>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {categories.map((cat) => {
          const items = integrations.filter((i) => i.category === cat);
          return (
            <div key={cat}>
              <p className="text-xs font-semibold text-[var(--text-primary)] mb-2 flex items-center gap-1.5">
                <Globe className="h-3 w-3 text-[var(--text-tertiary)]" />
                {cat}
              </p>
              <ul className="space-y-1.5">
                {items.map((item) => (
                  <li key={item.service} className="flex items-start gap-2">
                    <div className="mt-0.5 shrink-0">
                      <item.icon size={14} color={item.color} />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-[var(--text-primary)]">{item.label}</p>
                      <div className="flex flex-wrap gap-1 mt-0.5">
                        {item.capabilities.map((cap) => (
                          <span key={cap} className="inline-flex items-center rounded-full bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

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
} from "react-icons/si";
import { FaInstagram, FaLinkedin, FaMicrosoft, FaCalendar, FaTable, FaMapLocation } from "react-icons/fa6";
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
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock,
  Sparkles,
  Zap,
  ArrowRight,
  RefreshCw,
  Globe,
} from "lucide-react";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
];

const FUTURE_INTEGRATIONS = [
  { service: "facebook", label: "Facebook Pages", icon: SiFacebook, color: "#1877F2" as const },
  { service: "whatsapp", label: "WhatsApp Business", icon: SiWhatsapp, color: "#25D366" as const },
  { service: "instagram", label: "Instagram", icon: FaInstagram, color: "#E4405F" as const },
  { service: "linkedin", label: "LinkedIn", icon: FaLinkedin, color: "#0A66C2" as const },
  { service: "teams", label: "Microsoft Teams", icon: FaMicrosoft, color: "#6264A7" as const },
  { service: "google_calendar", label: "Google Calendar", icon: FaCalendar, color: "#4285F4" as const },
  { service: "google_sheets", label: "Google Sheets", icon: FaTable, color: "#0F9D58" as const },
  { service: "google_maps", label: "Google Maps", icon: FaMapLocation, color: "#EA4335" as const },
];

type HealthMap = Record<string, { connected: boolean; status: string; message: string }>;

/* ── Component ───────────────────────────────────────────────────── */

export function IntegrationPanel() {
  const router = useRouter();
  const [health, setHealth] = React.useState<HealthMap>({});
  const [isLoading, setIsLoading] = React.useState(true);
  const [loaded, setLoaded] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 300);
    fetchHealth();
    return () => clearTimeout(timer);
  }, []);

  const fetchHealth = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.integrationsHealth();
      if (res.data?.integrations) {
        setHealth(res.data.integrations);
      } else if (res.status === 401) {
        // Token expirado — redireciona para login
        router.push("/login");
        return;
      } else {
        setError("Não foi possível carregar o status das integrações.");
      }
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status === 401) {
        router.push("/login");
        return;
      }
      setError("Erro ao conectar com o servidor. Tente novamente.");
      console.error("[IntegrationPanel] fetchHealth error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  if (!loaded) return null;

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
        <button
          type="button"
          onClick={fetchHealth}
          disabled={isLoading}
          className="inline-flex items-center gap-1.5 mt-2 text-xs text-[var(--text-tertiary)] hover:text-[var(--text-primary)] transition-colors"
        >
          <RefreshCw className={cn("h-3 w-3", isLoading && "animate-spin")} />
          {isLoading ? "Verificando..." : "Atualizar status"}
        </button>
      </div>

      {/* ── Error Banner ────────────────────────────────────────── */}
      {error && (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Active Integration Cards ─────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {INTEGRATIONS.map((int, i) => (
          <IntegrationCard
            key={int.service}
            integration={int}
            health={health[int.service]}
            isLoading={isLoading}
            index={i}
          />
        ))}
      </div>

      {/* ── Capability Catalog ───────────────────────────────────── */}
      <CapabilityCatalog integrations={INTEGRATIONS} />

      {/* ── Future Integrations ──────────────────────────────────── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-4 w-4 text-[var(--text-tertiary)]" />
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Em breve
          </h3>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {FUTURE_INTEGRATIONS.map((int) => (
            <div
              key={int.service}
              className="relative group rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-0)]/60 p-5 opacity-50 hover:opacity-70 transition-all duration-300 cursor-default select-none"
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
  health,
  isLoading,
  index,
}: {
  integration: IntegrationMeta;
  health: { connected: boolean; status: string; message: string } | undefined;
  isLoading: boolean;
  index: number;
}) {
  const isConnected = health?.connected ?? false;
  const statusLabel = health === undefined
    ? "Carregando..."
    : health?.status === "connected" ? "Conectado"
    : health?.status === "error" ? "Erro"
    : "Desconectado";

  const badgeVariant = health === undefined
    ? "secondary"
    : isConnected ? "success"
    : health?.status === "error" ? "destructive"
    : "outline";

  return (
    <div
      className={cn(
        "group relative rounded-[var(--radius-lg)] border bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300",
        "hover:shadow-[var(--shadow-md)] hover:border-[var(--border-strong)]",
        isConnected ? "border-[var(--border-default)]" : "border-[var(--border-default)]"
      )}
      style={{ animationDelay: `${index * 80}ms` }}
    >
      {/* Status badge */}
      <div className="absolute -top-2 -right-2">
        {isLoading ? (
          <span className="inline-flex items-center rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] text-[var(--text-tertiary)]">
            <RefreshCw className="h-2.5 w-2.5 animate-spin mr-1" />
            Verificando
          </span>
        ) : (
          <span
            className={cn(
              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
              isConnected && "bg-[var(--color-success)]/10 text-[var(--color-success)]",
              !isConnected && health?.status !== "error" && "bg-[var(--surface-2)] text-[var(--text-tertiary)]",
              health?.status === "error" && "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
            )}
          >
            {isConnected ? <CheckCircle className="h-2.5 w-2.5" /> : health?.status === "error" ? <AlertTriangle className="h-2.5 w-2.5" /> : <XCircle className="h-2.5 w-2.5" />}
            {statusLabel}
          </span>
        )}
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

      {/* Status message */}
      {health?.message && (
        <p className="text-[10px] text-[var(--text-tertiary)] mt-2 border-t border-[var(--border-default)] pt-2 truncate">
          {isConnected ? "✅ " : health.status === "error" ? "⚠️ " : "⏳ "}
          {health.message}
        </p>
      )}
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

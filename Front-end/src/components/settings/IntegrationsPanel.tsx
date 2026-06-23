/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — IntegrationsPanel
   Manage third‑party service connections: OAuth flow, token setup,
   health checks, and disconnection — all per‑user from the DB.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
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
import { FaInstagram, FaLinkedin, FaMicrosoft, FaCalendar, FaMapLocation, FaVideo, FaGoogleDrive } from "react-icons/fa6";
import {
  Plug,
  PlugZap,
  Unplug,
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ExternalLink,
  Save,
  Key,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { ApiResponse } from "@/lib/api";

/* ── Types ──────────────────────────────────────────────────────── */

interface IntegrationMeta {
  service: string;
  label: string;
  color: string;
  category: string;
  available: boolean;
  icon?: string;
}

interface HealthStatus {
  connected: boolean;
  status: string;
  message: string;
  details?: Record<string, unknown>;
}

interface IntegrationState {
  meta: IntegrationMeta;
  health?: HealthStatus;
}

/* ── Provider categories & ordering ─────────────────────────────── */

const CATEGORY_ORDER = [
  "communication",
  "project_management",
  "storage",
  "productivity",
  "utilities",
  "social",
  "coming_soon",
];

const CATEGORY_LABELS: Record<string, string> = {
  communication: "Comunicação",
  project_management: "Gestão de Projetos",
  storage: "Armazenamento",
  productivity: "Produtividade",
  utilities: "Utilitários",
  social: "Redes Sociais",
  coming_soon: "Em Breve",
};

/* ── Popup helpers ──────────────────────────────────────────────── */

function openOAuthPopup(url: string): Promise<{ success: boolean; provider: string }> {
  return new Promise((resolve) => {
    const popup = window.open(url, "oauthPopup", "width=600,height=700");
    if (!popup) {
      resolve({ success: false, provider: "" });
      return;
    }

    const handler = (event: MessageEvent) => {
      // Only accept messages from our backend
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === "oauth-result") {
        window.removeEventListener("message", handler);
        resolve(event.data);
      }
    };
    window.addEventListener("message", handler);

    // Fallback: poll for popup close
    const poll = setInterval(() => {
      if (popup.closed) {
        clearInterval(poll);
        window.removeEventListener("message", handler);
        resolve({ success: false, provider: "" });
      }
    }, 500);
  });
}

/* ── API helpers ────────────────────────────────────────────────── */

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T | null> {
  try {
    const { clientFetch } = await import("@/lib/api");
    // Use clientFetch which injects the Bearer token
    const res = await clientFetch<T>(url, {
      method: options?.method ?? "GET",
      body: options?.body,
    });
    return res.data;
  } catch {
    return null;
  }
}

async function fetchIntegrations(): Promise<IntegrationMeta[]> {
  const data = await apiFetch<{ integrations: IntegrationMeta[] }>("/integrations");
  return data?.integrations ?? [];
}

async function fetchHealth(): Promise<Record<string, HealthStatus>> {
  const data = await apiFetch<{ integrations: Record<string, HealthStatus> }>("/integrations/health");
  return data?.integrations ?? {};
}

async function disconnectIntegration(service: string): Promise<boolean> {
  const data = await apiFetch<{ disconnected: boolean }>(`/integrations/${service}/disconnect`, {
    method: "DELETE",
  });
  return data?.disconnected ?? false;
}

/* ── Component ──────────────────────────────────────────────────── */

export function IntegrationsPanel() {
  const t = useTranslations("settings");

  const [integrations, setIntegrations] = React.useState<IntegrationState[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [disconnecting, setDisconnecting] = React.useState<string | null>(null);
  const [telegramToken, setTelegramToken] = React.useState("");
  const [trelloToken, setTrelloToken] = React.useState("");
  const [savingTelegram, setSavingTelegram] = React.useState(false);
  const [savingTrello, setSavingTrello] = React.useState(false);
  const [tokenError, setTokenError] = React.useState("");

  // Load integration list + health on mount
  const load = React.useCallback(async () => {
    setLoading(true);
    const [metaList, healthMap] = await Promise.all([
      fetchIntegrations(),
      fetchHealth(),
    ]);

    const merged: IntegrationState[] = metaList.map((meta) => ({
      meta,
      health: healthMap[meta.service],
    }));

    setIntegrations(merged);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Handle OAuth connect
  const handleOAuthConnect = async (service: string) => {
    const data = await apiFetch<{ authorization_url: string }>(`/auth/${service}/connect`);
    if (!data?.authorization_url) return;

    const result = await openOAuthPopup(data.authorization_url);
    if (result.success) {
      // Refresh health to show the new connection
      const healthMap = await fetchHealth();
      setIntegrations((prev) =>
        prev.map((s) =>
          s.meta.service === service ? { ...s, health: healthMap[service] } : s
        )
      );
    }
  };

  // Handle Trello connect
  const handleTrelloConnect = async () => {
    const data = await apiFetch<{ authorization_url: string }>("/auth/trello/connect");
    if (!data?.authorization_url) return;

    const result = await openOAuthPopup(data.authorization_url);
    if (result.success) {
      const healthMap = await fetchHealth();
      setIntegrations((prev) =>
        prev.map((s) =>
          s.meta.service === "trello" ? { ...s, health: healthMap.trello } : s
        )
      );
    }
  };

  // Handle disconnect
  const handleDisconnect = async (service: string) => {
    setDisconnecting(service);
    await disconnectIntegration(service);
    // Refresh health
    const healthMap = await fetchHealth();
    setIntegrations((prev) =>
      prev.map((s) =>
        s.meta.service === service ? { ...s, health: healthMap[service] } : s
      )
    );
    setDisconnecting(null);
  };

  // Save Telegram token
  const handleSaveTelegram = async () => {
    if (!telegramToken.trim()) return;
    setSavingTelegram(true);
    setTokenError("");

    try {
      const { clientFetch } = await import("@/lib/api");
      const res = await clientFetch<{ success: boolean }>(
        `/auth/telegram/token?bot_token=${encodeURIComponent(telegramToken.trim())}`,
        { method: "POST" }
      );
      if (res.data?.success) {
        setTelegramToken("");
        const healthMap = await fetchHealth();
        setIntegrations((prev) =>
          prev.map((s) =>
            s.meta.service === "telegram"
              ? { ...s, health: healthMap.telegram }
              : s
          )
        );
      } else {
        setTokenError(res.error?.message ?? "Erro ao salvar token");
      }
    } catch {
      setTokenError("Erro de conexão com o servidor");
    }
    setSavingTelegram(false);
  };

  // Save Trello token
  const handleSaveTrelloToken = async () => {
    if (!trelloToken.trim()) return;
    setSavingTrello(true);
    setTokenError("");

    try {
      const { clientFetch } = await import("@/lib/api");
      const res = await clientFetch<{ success: boolean }>(
        `/auth/trello/token?token=${encodeURIComponent(trelloToken.trim())}`,
        { method: "POST" }
      );
      if (res.data?.success) {
        setTrelloToken("");
        const healthMap = await fetchHealth();
        setIntegrations((prev) =>
          prev.map((s) =>
            s.meta.service === "trello"
              ? { ...s, health: healthMap.trello }
              : s
          )
        );
      } else {
        setTokenError(res.error?.message ?? "Erro ao salvar token");
      }
    } catch {
      setTokenError("Erro de conexão com o servidor");
    }
    setSavingTrello(false);
  };

  // Group integrations by category
  const grouped = React.useMemo(() => {
    const map = new Map<string, IntegrationState[]>();
    for (const s of integrations) {
      const cat = s.meta.category || "other";
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(s);
    }
    // Sort categories by CATEGORY_ORDER
    return [...map.entries()].sort(
      (a, b) => CATEGORY_ORDER.indexOf(a[0]) - CATEGORY_ORDER.indexOf(b[0])
    );
  }, [integrations]);

  /* ── Render helpers ───────────────────────────────────────────── */

  const statusIcon = (health?: HealthStatus) => {
    if (!health) return <Loader2 className="h-4 w-4 animate-spin text-[var(--text-tertiary)]" />;
    if (health.connected) return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    if (health.status === "error") return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    return <XCircle className="h-4 w-4 text-[var(--text-tertiary)]" />;
  };

  const canOAuthConnect = (service: string) =>
    ["slack", "discord", "jira", "zoom", "google_drive", "gmail", "google_calendar", "google_sheets", "google_meet"].includes(service);

  const isTelegram = (service: string) => service === "telegram";
  const isTrello = (service: string) => service === "trello";

  /* ── Main render ──────────────────────────────────────────────── */

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">
          Integrações
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Conecte serviços de terceiros para expandir as capacidades dos seus agentes.
        </p>
      </div>

      {/* Token error */}
      {tokenError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {tokenError}
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-[var(--brand-accent)]" />
          <span className="ml-2 text-sm text-[var(--text-secondary)]">
            Carregando integrações…
          </span>
        </div>
      )}

      {/* Integration groups */}
      {!loading &&
        grouped.map(([category, items]) => {
          const catLabel = CATEGORY_LABELS[category] ?? category;
          const isFuture = category === "coming_soon";

          return (
            <section key={category} className="space-y-3">
              <h3 className="text-sm font-medium uppercase tracking-wider text-[var(--text-tertiary)]">
                {catLabel}
              </h3>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(({ meta, health }) => (
                  <div
                    key={meta.service}
                    className={cn(
                      "rounded-xl border border-[var(--border-default)] bg-[var(--surface-0)] p-4 transition-shadow hover:shadow-[var(--shadow-md)]",
                      !meta.available && "opacity-60"
                    )}
                  >
                    {/* Top row: icon + name + status */}
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-lg text-white"
                          style={{ backgroundColor: meta.color || "#666" }}
                        >
                          <ServiceIcon service={meta.service} />
                        </div>
                        <div>
                          <span className="font-medium text-[var(--text-primary)]">
                            {meta.label}
                          </span>
                          {meta.available && health && (
                            <div className="flex items-center gap-1 text-xs">
                              {statusIcon(health)}
                              <span
                                className={cn(
                                  health.connected
                                    ? "text-green-600"
                                    : health.status === "error"
                                      ? "text-yellow-600"
                                      : "text-[var(--text-tertiary)]"
                                )}
                              >
                                {health.connected
                                  ? "Conectado"
                                  : health.status === "error"
                                    ? "Erro"
                                    : "Desconectado"}
                              </span>
                            </div>
                          )}
                          {!meta.available && (
                            <span className="text-xs text-[var(--text-tertiary)]">
                              Em breve
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Health message */}
                    {meta.available && health?.message && (
                      <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                        {health.message}
                      </p>
                    )}

                    {/* Action buttons */}
                    {meta.available && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {!health?.connected && !isTelegram(meta.service) && !isTrello(meta.service) && canOAuthConnect(meta.service) && (
                          <button
                            onClick={() => handleOAuthConnect(meta.service)}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                          >
                            <Plug className="h-3.5 w-3.5" />
                            Conectar
                          </button>
                        )}

                        {!health?.connected && isTelegram(meta.service) && (
                          <div className="flex w-full flex-col gap-2">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={telegramToken}
                                onChange={(e) => setTelegramToken(e.target.value)}
                                placeholder="Token do Bot (ex: 123456:ABC-DEF…)"
                                className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
                              />
                              <button
                                onClick={handleSaveTelegram}
                                disabled={savingTelegram || !telegramToken.trim()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                {savingTelegram ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Save className="h-3.5 w-3.5" />
                                )}
                                Salvar
                              </button>
                            </div>
                          </div>
                        )}

                        {!health?.connected && isTrello(meta.service) && (
                          <div className="flex w-full flex-col gap-2">
                            <button
                              onClick={handleTrelloConnect}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90"
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                              Autorizar no Trello
                            </button>
                            <div className="flex gap-2">
                              <input
                                type="text"
                                value={trelloToken}
                                onChange={(e) => setTrelloToken(e.target.value)}
                                placeholder="Cole o token do Trello aqui"
                                className="flex-1 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-accent)]"
                              />
                              <button
                                onClick={handleSaveTrelloToken}
                                disabled={savingTrello || !trelloToken.trim()}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-accent)] px-3 py-1.5 text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                              >
                                {savingTrello ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Key className="h-3.5 w-3.5" />
                                )}
                                Validar
                              </button>
                            </div>
                          </div>
                        )}

                        {health?.connected && (
                          <>
                            <button
                              onClick={() => handleDisconnect(meta.service)}
                              disabled={disconnecting === meta.service}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 px-3 py-1.5 text-xs font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                            >
                              {disconnecting === meta.service ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                              ) : (
                                <Unplug className="h-3.5 w-3.5" />
                              )}
                              Desconectar
                            </button>

                            <button
                              onClick={load}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-[var(--border-default)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-1)]"
                            >
                              <RefreshCw className="h-3.5 w-3.5" />
                              Atualizar
                            </button>
                          </>
                        )}

                        {!health?.connected && !isTelegram(meta.service) && !isTrello(meta.service) && !canOAuthConnect(meta.service) && (
                          <span className="text-xs text-[var(--text-tertiary)]">
                            Conecte-se pelo app do provedor
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

/* ── Service icon mapping ───────────────────────────────────────── */

function ServiceIcon({ service, className }: { service: string; className?: string }) {
  const props = { className: cn("h-5 w-5", className) };
  switch (service) {
    case "discord": return <SiDiscord {...props} />;
    case "telegram": return <SiTelegram {...props} />;
    case "whatsapp": return <SiWhatsapp {...props} />;
    case "facebook": return <SiFacebook {...props} />;
    case "trello": return <SiTrello {...props} />;
    case "jira": return <SiJira {...props} />;
    case "slack": return <SiSlack {...props} />;
    case "zoom": return <SiZoom {...props} />;
    case "google_drive": return <FaGoogleDrive {...props} />;
    case "gmail": return <span className="text-xs font-bold">GM</span>;
    case "google_calendar": return <FaCalendar {...props} />;
    case "google_sheets": return <span className="text-xs font-bold">SH</span>;
    case "google_meet": return <FaVideo {...props} />;
    case "google_maps": return <FaMapLocation {...props} />;
    case "google_photos": return <SiGooglephotos {...props} />;
    case "instagram": return <FaInstagram {...props} />;
    case "linkedin": return <FaLinkedin {...props} />;
    case "teams": return <FaMicrosoft {...props} />;
    default: return <Plug className="h-5 w-5" />;
  }
}

/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard — DashboardContent (Client)
   Receives server-fetched data as props. Handles interactive actions
   (run, pause, configure) via API calls.

   Resilience: if the backend is unreachable (network error), the
   dashboard renders with zeroed stats + a subtle offline banner
   instead of a full error takeover.  Real errors (auth, 500, etc.)
   still show the error block with retry.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations, useLocale } from "next-intl";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
  Bot,
  Workflow,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  BarChart3,
  RefreshCw,
  WifiOff,
  Sparkles,
} from "lucide-react";
import { LoginOverlay } from "@/components/ui/LoginOverlay";
import { StatsCard, AgentCard } from "@/components/dashboard";
import { type Agent } from "@/store";
import { cn } from "@/lib/utils";
import {
  api,
  type DashboardStats,
  type ApiError,
  isNetworkError,
  EMPTY_DASHBOARD_STATS,
  checkBackendHealth,
  resetHealthState,
} from "@/lib/api";

/* ── Props ────────────────────────────────────────────────────────── */

interface DashboardContentProps {
  section: "stats" | "agents" | "all";
  /** Pre-fetched stats from server (SSR) */
  initialStats: DashboardStats | null;
  /** Pre-fetched agents from server (SSR) */
  initialAgents: Agent[];
  /** If the server-side fetch failed, the error details for diagnosis. */
  serverError?: ApiError | null;
}

/* ── Component ────────────────────────────────────────────────────── */

export function DashboardContent({
  section,
  initialStats,
  initialAgents,
  serverError,
}: DashboardContentProps) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const userName = session?.user?.name || t("user");

  const hour = new Date().getHours();
  const timeOfDay =
    hour < 12 ? t("morning") : hour < 18 ? t("afternoon") : t("evening");

  /* ── Local state ────────────────────────────────────────────────── */

  const [stats, setStats] = React.useState<DashboardStats | null>(
    // If server-side fetch gave us null AND the server classified it as a
    // network error, start with zeroed stats so the UI renders immediately.
    isNetworkError(serverError ?? null) ? EMPTY_DASHBOARD_STATS : initialStats
  );
  const [agents, setAgents] = React.useState<Agent[]>(initialAgents);
  const [actionError, setActionError] = React.useState<string | null>(null);

  /**
   * Whether the *client* believes the backend is unreachable.
   *
   * This state is NEVER initialised from the server-side error because
   * the server might not be able to reach `localhost:8000` directly
   * while the client CAN reach it through the Next.js proxy.
   *
   * The only situations that turn this flag on are:
   *   1. Browser reports the user is offline (navigator.onLine === false)
   *   2. A client-side health‑check against the backend fails
   */
  const [backendOffline, setBackendOffline] = React.useState(
    () => typeof navigator !== "undefined" && navigator.onLine === false
  );
  const [isRetrying, setIsRetrying] = React.useState(false);

  // Banner priority:
  //   - Offline alert (amber, retry button)  when authenticated + backend offline
  //   - Nothing                              otherwise
  const showOfflineAlert = isAuthenticated && backendOffline;

  /* ── Listen to browser online/offline events ────────────────────── */

  React.useEffect(() => {
    const goOnline = () => setBackendOffline(false);
    const goOffline = () => setBackendOffline(true);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  /* ── Determine if we need to fallback-fetch on the client ───────── */

  const needsStatsFetch =
    (section === "stats" || section === "all") && initialStats === null;
  const needsAgentsFetch =
    (section === "agents" || section === "all") && initialAgents.length === 0;
  const needsFallbackFetch = needsStatsFetch || needsAgentsFetch;

  /**
   * Helper: given an API error, decide whether it is a connectivity issue
   * (user offline / backend down) or a genuine API error.
   *
   * Returns `"offline"` / `"backend_down"` / `"api_error"`.
   */
  const classifyFetchError = React.useCallback(
    async (error: ApiError): Promise<"offline" | "backend_down" | "api_error"> => {
      // 1. User is offline according to the browser
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        return "offline";
      }

      // 2. The fetch itself threw a network-level exception
      if (isNetworkError(error)) {
        // Double‑check with the health endpoint to be sure
        const healthy = await checkBackendHealth();
        // Always reset the module-level cache after a health check so we
        // don't get stale false positives for the next 15 s.
        if (!healthy) resetHealthState();

        return healthy ? "api_error" : "backend_down";
      }

      // 3. Any other error code → real API error
      return "api_error";
    },
    [],
  );

  /**
   * Attempt to fetch data from the client side.
   * On connectivity failure: shows zeros + offline banner (not a full error).
   * On real API error (auth, 500, etc.): shows error block with retry.
   */
  const fetchFallbackData = React.useCallback(async () => {
    setIsRetrying(true);
    setActionError(null);

    try {
      const promises: Promise<void>[] = [];

      if (needsStatsFetch) {
        promises.push(
          api.getDashboardStats().then(async (res) => {
            if (res.error) {
              const kind = await classifyFetchError(res.error);
              if (kind === "offline" || kind === "backend_down") {
                setStats(EMPTY_DASHBOARD_STATS);
                setBackendOffline(true);
              } else {
                throw new Error(res.error.message);
              }
            } else {
              setStats(res.data);
              setBackendOffline(false);
            }
          })
        );
      }

      if (needsAgentsFetch) {
        promises.push(
          api.getAgents().then(async (res) => {
            if (res.error) {
              const kind = await classifyFetchError(res.error);
              if (kind === "offline" || kind === "backend_down") {
                setAgents([]);
                setBackendOffline(true);
              } else {
                throw new Error(res.error.message);
              }
            } else {
              setAgents(res.data?.items ?? []);
              setBackendOffline(false);
            }
          })
        );
      }

      await Promise.all(promises);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : t("error.loadingFailed");
      setActionError(msg);
    } finally {
      setIsRetrying(false);
    }
  }, [needsStatsFetch, needsAgentsFetch, t, classifyFetchError]);

  /* ── Fallback fetch for edge cases (non-SSR contexts) ───────────── */

  const didFetch = React.useRef(false);
  React.useEffect(() => {
    if (needsFallbackFetch && !didFetch.current) {
      didFetch.current = true;
      fetchFallbackData();
    }
  }, [needsFallbackFetch, fetchFallbackData]);

  /* ── Manual reconnection handler ────────────────────────────────── */

  const handleReconnect = React.useCallback(async () => {
    setIsRetrying(true);
    setActionError(null);

    try {
      // 1. If the browser says offline, don't even try
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        setBackendOffline(true);
        setIsRetrying(false);
        return;
      }

      // 2. Check backend health from the client side
      const healthy = await checkBackendHealth();
      // Always reset the module-level cache so next call is fresh
      resetHealthState();

      if (!healthy) {
        setBackendOffline(true);
        setIsRetrying(false);
        return;
      }

      // 3. Backend is reachable — fetch fresh data
      setBackendOffline(false);

      const [statsRes, agentsRes] = await Promise.all([
        api.getDashboardStats(),
        api.getAgents(),
      ]);

      if (statsRes.error) {
        const kind = await classifyFetchError(statsRes.error);
        if (kind === "offline" || kind === "backend_down") {
          setStats(EMPTY_DASHBOARD_STATS);
          setBackendOffline(true);
        } else {
          setActionError(statsRes.error.message);
        }
      } else {
        setStats(statsRes.data);
      }

      if (agentsRes.error) {
        const kind = await classifyFetchError(agentsRes.error);
        if (kind === "offline" || kind === "backend_down") {
          setAgents([]);
          setBackendOffline(true);
        } else if (!actionError) {
          setActionError(agentsRes.error.message);
        }
      } else {
        setAgents(agentsRes.data?.items ?? []);
      }
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : t("error.loadingFailed")
      );
    } finally {
      setIsRetrying(false);
    }
  }, [t, actionError, classifyFetchError]);

  /* ── Action handlers (real API calls) ──────────────────────────── */

  const handleRun = React.useCallback(async (id: string) => {
    setActionError(null);
    try {
      const res = await api.runAgent(id);
      if (res.error) {
        setActionError(res.error.message);
        return;
      }
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "running" as const } : a
        )
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("error.unknown"));
    }
  }, []);

  const handlePause = React.useCallback(async (id: string) => {
    setActionError(null);
    try {
      const res = await api.pauseAgent(id);
      if (res.error) {
        setActionError(res.error.message);
        return;
      }
      setAgents((prev) =>
        prev.map((a) =>
          a.id === id ? { ...a, status: "paused" as const } : a
        )
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : t("error.unknown"));
    }
  }, []);

  const handleConfigure = React.useCallback((id: string) => {
    window.location.href = `/agents?id=${id}`;
  }, []);

  /* ── Error state (real error, not offline) ──────────────────────── */

  if (actionError) {
    const alertContent = (
      <div className="space-y-8">
        {section !== "agents" && showOfflineAlert && (
          <DashboardAlert
            icon={WifiOff}
            label={t("error.offlineBanner")}
            onReconnect={handleReconnect}
            isRetrying={isRetrying}
            retryLabel={t("error.retry")}
          />
        )}
        <LoginOverlay label={t("loginPrompt")}>
          <p className="text-sm text-[var(--text-secondary)] py-8 text-center">
            {t("error.unknown")}
          </p>
        </LoginOverlay>
      </div>
    );
    return alertContent;
  }

  /* ── Render ─────────────────────────────────────────────────────── */

  const showStats = section === "all" || section === "stats";
  const showAgents = section === "all" || section === "agents";

  return (
    <div className="space-y-8">
      {section !== "agents" && showOfflineAlert && (
        <DashboardAlert
          icon={WifiOff}
          label={t("error.offlineBanner")}
          onReconnect={handleReconnect}
          isRetrying={isRetrying}
          retryLabel={t("error.retry")}
        />
      )}

      {/* Welcome header — always visible (no blur) */}
      {showStats && (
        <div className="mb-2">
          <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
            {t("welcome", { timeOfDay, name: userName })}
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            {t("subtitle")}
          </p>
        </div>
      )}

      {/* Blur-protected content: KPIs + Quick actions + Agents */}
      <LoginOverlay label={t("loginPrompt")}>
        {showStats && (
          <>
            <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
              <StatsCard
                label={t("stats.activeAgents")}
                value={stats?.activeAgents ?? 0}
                icon={Bot}
                trend={
                  (stats?.activeAgents ?? 0) > 0
                    ? { value: `${stats?.activeAgents}`, positive: true }
                    : undefined
                }
                data-testid="stat-active-agents"
              />
              <StatsCard
                label={t("stats.automationsToday")}
                value={stats?.automationsToday ?? 0}
                icon={Workflow}
                trend={
                  (stats?.automationsToday ?? 0) > 0
                    ? { value: `${stats?.automationsToday}`, positive: true }
                    : undefined
                }
                data-testid="stat-automations"
              />
              <StatsCard
                label={t("stats.successRate")}
                value={
                  stats?.successRate != null && stats.successRate > 0
                    ? `${stats.successRate}%`
                    : "---"
                }
                icon={TrendingUp}
                trend={
                  (stats?.successRate ?? 0) >= 90
                    ? { value: `${stats?.successRate}%`, positive: true }
                    : (stats?.successRate ?? 0) > 0
                      ? { value: `${stats?.successRate}%`, positive: false }
                      : undefined
                }
                data-testid="stat-success-rate"
              />
              <StatsCard
                label={t("stats.pendingApprovals")}
                value={stats?.pendingApprovals ?? 0}
                icon={Clock}
                trend={
                  (stats?.pendingApprovals ?? 0) > 0
                    ? { value: `${stats?.pendingApprovals}`, positive: false }
                    : undefined
                }
                data-testid="stat-pending"
              />
            </div>

            {/* Quick actions */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
                {t("quickActions")}
              </h2>
              <p className="text-xs text-[var(--text-secondary)] mb-4">
                {t("quickActionsDescription")}
              </p>
              <div className="flex flex-wrap gap-4">
                <QuickAction
                  icon={Plus}
                  label={t("createAutomation")}
                  href="/automations"
                  variant="primary"
                />
                <QuickAction
                  icon={Bot}
                  label={t("viewAgents")}
                  href="/agents"
                  variant="secondary"
                />
                <QuickAction
                  icon={BarChart3}
                  label={t("viewReports")}
                  href="/dashboard"
                  variant="secondary"
                />
              </div>
            </div>
          </>
        )}

        {/* "Atividades recentes" */}
        {showAgents && (
          <section aria-labelledby="recent-activity-heading">
            <h2
              id="recent-activity-heading"
              className="text-lg font-semibold text-[var(--text-primary)] mb-3"
            >
              {t("recentActivity")}
            </h2>

            {agents.length === 0 ? (
              backendOffline ? (
                <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-0)] p-8 text-center">
                  <Bot
                    className="mx-auto h-10 w-10 text-[var(--text-tertiary)] mb-3"
                    aria-hidden="true"
                  />
                  <p className="text-sm font-medium text-[var(--text-primary)] mb-1">
                    {t("empty.offlineTitle")}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {t("empty.offlineDescription")}
                  </p>
                </div>
              ) : (
                <div
                  className="flex flex-col items-center justify-center py-12 text-center"
                  role="status"
                >
                  <Sparkles
                    className="mx-auto h-10 w-10 text-[var(--text-tertiary)] mb-3"
                    aria-hidden="true"
                  />
                  <p className="text-sm text-[var(--text-secondary)]">
                    {t("recentActivityEmpty")}
                  </p>
                </div>
              )
            ) : (
              <div
                className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
                role="list"
                aria-label={t("recentActivity")}
              >
                {agents.map((agent) => (
                  <div key={agent.id} role="listitem">
                    <AgentCard
                      agent={agent}
                      onRun={handleRun}
                      onPause={handlePause}
                      onConfigure={handleConfigure}
                      data-testid={`agent-card-${agent.id}`}
                    />
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
      </LoginOverlay>
    </div>
  );
}

/* ── Dashboard Alert ──────────────────────────────────────────────── */
/* Unified alert shown in the content area:
   - Not authenticated → clickable link to login page
   - Authenticated + backend offline → retry button              */

function DashboardAlert({
  icon: Icon,
  label,
  href,
  onReconnect,
  isRetrying,
  retryLabel,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href?: string;
  onReconnect?: () => void;
  isRetrying?: boolean;
  retryLabel?: string;
}) {
  const inner = (
    <div
      role="alert"
      className={cn(
        "flex items-center justify-between gap-4 rounded-[var(--radius-lg)] border border-amber-300/60 bg-amber-50 px-5 py-3 text-sm",
        href && "cursor-pointer transition-colors hover:bg-amber-100"
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon
          className="h-4 w-4 shrink-0 text-amber-600"
          aria-hidden="true"
        />
        <span className="text-amber-800 font-medium truncate">{label}</span>
      </div>

      {href ? (
        <ArrowRight className="h-4 w-4 shrink-0 text-amber-600" aria-hidden="true" />
      ) : onReconnect ? (
        <button
          type="button"
          onClick={onReconnect}
          disabled={isRetrying}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium bg-amber-100 text-amber-800 hover:bg-amber-200 transition-colors disabled:opacity-50 min-h-[36px]"
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", isRetrying && "animate-spin")}
            aria-hidden="true"
          />
          {isRetrying ? retryLabel + "..." : retryLabel}
        </button>
      ) : null}
    </div>
  );

  if (href) {
    return <Link href={href}>{inner}</Link>;
  }

  return inner;
}

/* ── End of component declarations ────────────────────────────────── */

/* ── Quick Action Button ──────────────────────────────────────────── */

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

function QuickAction({
  icon: Icon,
  label,
  href,
  variant,
}: QuickActionProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5",
        "text-sm font-medium transition-colors min-h-[44px]",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--brand-accent)]",
        variant === "primary"
          ? "bg-[var(--brand-accent)] text-[var(--brand-accent-foreground)] hover:bg-[var(--brand-accent-hover)]"
          : "bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] border border-[var(--border-default)]"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

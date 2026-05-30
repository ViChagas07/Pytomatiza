/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard — DashboardContent (Client)
   Fetches and renders dashboard data: stats, agent cards.
   Split from the server page to enable Suspense streaming.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  Bot,
  Workflow,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight,
  BarChart3,
} from "lucide-react";
import { StatsCard, AgentCard, StatsSkeleton, AgentCardsSkeleton } from "@/components/dashboard";
import { type Agent } from "@/store";
import { cn } from "@/lib/utils";

/* ── Mock data (replace with API calls) ──────────────────────────── */

const mockAgents: Agent[] = [
  {
    id: "1",
    name: "Email Attachment Saver",
    description:
      "Monitors inbox for attachments, saves them to Google Drive, and notifies via Slack.",
    type: "productivity",
    status: "running",
    lastRun: new Date().toISOString(),
    successRate: 98,
    totalExecutions: 1423,
    isEditable: true,
  },
  {
    id: "2",
    name: "Weekly Report Generator",
    description:
      "Compiles data from multiple sources and generates a formatted PDF report every Monday.",
    type: "data",
    status: "idle",
    lastRun: new Date(Date.now() - 86400000).toISOString(),
    successRate: 100,
    totalExecutions: 52,
    isEditable: true,
  },
  {
    id: "3",
    name: "Social Media Monitor",
    description:
      "Tracks brand mentions across Twitter, LinkedIn, and Reddit. Auto-responds to support queries.",
    type: "content",
    status: "running",
    lastRun: new Date().toISOString(),
    successRate: 87,
    totalExecutions: 3890,
    isEditable: true,
  },
  {
    id: "4",
    name: "Database Backup Agent",
    description:
      "Performs nightly database backups and verifies integrity. Alerts on failure.",
    type: "admin",
    status: "error",
    lastRun: new Date(Date.now() - 43200000).toISOString(),
    successRate: 95,
    totalExecutions: 365,
    isEditable: true,
  },
  {
    id: "5",
    name: "API Health Checker",
    description:
      "Pings all internal APIs every minute. Escalates to PagerDuty on downtime.",
    type: "technical",
    status: "idle",
    lastRun: new Date().toISOString(),
    successRate: 99,
    totalExecutions: 8760,
    isEditable: true,
  },
  {
    id: "6",
    name: "Invoice Processor",
    description:
      "Extracts data from PDF invoices using OCR and pushes to accounting software.",
    type: "data",
    status: "paused",
    lastRun: new Date(Date.now() - 259200000).toISOString(),
    successRate: 92,
    totalExecutions: 210,
    isEditable: false,
  },
];

const mockStats = {
  activeAgents: 4,
  automationsToday: 127,
  successRate: 96.4,
  pendingApprovals: 3,
};

/* ── Props ────────────────────────────────────────────────────────── */

interface DashboardContentProps {
  section: "stats" | "agents" | "all";
}

/* ── Component ────────────────────────────────────────────────────── */

export function DashboardContent({ section }: DashboardContentProps) {
  const t = useTranslations("dashboard");
  const { data: session } = useSession();
  const userName = session?.user?.name || "User";

  const hour = new Date().getHours();
  const timeOfDay =
    hour < 12 ? t("morning") : hour < 18 ? t("afternoon") : t("evening");

  /* Simulate data loading */
  const [loaded, setLoaded] = React.useState(false);
  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (!loaded) {
    if (section === "stats") return <StatsSkeleton />;
    if (section === "agents") return <AgentCardsSkeleton />;
    return (
      <>
        <StatsSkeleton />
        <AgentCardsSkeleton />
      </>
    );
  }

  const handleRun = (id: string) => {
    console.log("Run agent:", id);
  };

  const handlePause = (id: string) => {
    console.log("Pause agent:", id);
  };

  const handleConfigure = (id: string) => {
    console.log("Configure agent:", id);
  };

  return (
    <div className="space-y-8">
      {/* Welcome header (only for "all" or initial render) */}
      {(section === "all" || section === "stats") && (
        <>
          <div className="mb-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
              {t("welcome", { timeOfDay, name: userName })}
            </h1>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t("subtitle")}
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
            <StatsCard
              label={t("stats.activeAgents")}
              value={mockStats.activeAgents}
              icon={Bot}
              trend={{ value: "+2", positive: true }}
              data-testid="stat-active-agents"
            />
            <StatsCard
              label={t("stats.automationsToday")}
              value={mockStats.automationsToday}
              icon={Workflow}
              trend={{ value: "12%", positive: true }}
              data-testid="stat-automations"
            />
            <StatsCard
              label={t("stats.successRate")}
              value={`${mockStats.successRate}%`}
              icon={TrendingUp}
              trend={{ value: "0.3%", positive: true }}
              data-testid="stat-success-rate"
            />
            <StatsCard
              label={t("stats.pendingApprovals")}
              value={mockStats.pendingApprovals}
              icon={Clock}
              trend={{ value: "1", positive: false }}
              data-testid="stat-pending"
            />
          </div>
        </>
      )}

      {/* Quick actions */}
      {(section === "all" || section === "stats") && (
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
      )}

      {/* Agent cards grid */}
      {(section === "all" || section === "agents") && (
        <div>
          {section === "agents" && (
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                {t("recentActivity")}
              </h2>
            </div>
          )}
          <div
            className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
            role="list"
            aria-label="Agents"
          >
            {mockAgents.map((agent) => (
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
        </div>
      )}
    </div>
  );
}

/* ── Quick Action Button ──────────────────────────────────────────── */

interface QuickActionProps {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  href: string;
  variant: "primary" | "secondary";
}

function QuickAction({ icon: Icon, label, href, variant }: QuickActionProps) {
  return (
    <a
      href={href}
      className={cn(
        "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2.5",
        "text-sm font-medium transition-colors min-h-[44px]",
        "focus-visible:outline-2 focus-visible:outline-offset-2",
        "focus-visible:outline-[var(--brand-accent)]",
        variant === "primary"
          ? "bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent-hover)]"
          : "bg-[var(--surface-1)] text-[var(--text-primary)] hover:bg-[var(--surface-2)] border border-[var(--border-default)]"
      )}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {label}
      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
    </a>
  );
}

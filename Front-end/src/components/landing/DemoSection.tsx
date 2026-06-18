"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import * as Tabs from "@radix-ui/react-tabs";
import {
  GitBranch,
  BarChart3,
  Zap,
  Bot,
  Workflow,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
  FileText,
  MessageSquare,
  Settings,
  ArrowRight,
  RefreshCw,
  Mail,
} from "lucide-react";
import { cn } from "@/lib/utils";

const tabs = ["workflows", "dashboard", "editor", "automations"] as const;

export function DemoSection() {
  const t = useTranslations("landing");
  const [activeTab, setActiveTab] = React.useState<string>(tabs[0]);

  return (
    <section aria-labelledby="demo-heading" className="py-16 md:py-24 bg-[var(--surface-1)]/50">
      <div className="mx-auto max-w-7xl px-4 lg:px-6">
        <div className="text-center">
          <h2
            id="demo-heading"
            className="text-3xl font-bold md:text-4xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t("demo.title")}
          </h2>
          <p className="mx-auto mt-3 max-w-2xl text-[var(--text-secondary)]">
            {t("demo.subtitle")}
          </p>
        </div>

        <Tabs.Root
          value={activeTab}
          onValueChange={setActiveTab}
          className="mt-10"
        >
          <Tabs.List
            className="flex justify-center gap-1 rounded-[var(--radius-lg)] bg-[var(--surface-2)] p-1 w-fit mx-auto"
            aria-label={t("demo.tabsLabel")}
          >
            {tabs.map((tab) => (
              <Tabs.Trigger
                key={tab}
                value={tab}
                className={cn(
                  "rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium transition-all",
                  "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
                  "data-[state=active]:bg-[var(--surface-0)] data-[state=active]:text-[var(--text-primary)] data-[state=active]:shadow-[var(--shadow-xs)]"
                )}
              >
                {t(`demo.${tab}`)}
              </Tabs.Trigger>
            ))}
          </Tabs.List>

          {tabs.map((tab) => (
            <Tabs.Content key={tab} value={tab} className="mt-8 outline-none">
              <DemoMockup tab={tab} />
            </Tabs.Content>
          ))}
        </Tabs.Root>
      </div>
    </section>
  );
}

function DemoMockup({ tab }: { tab: string }) {
  return (
    <div className="mx-auto max-w-4xl rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-md)] overflow-hidden">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-4 py-3">
        <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-danger)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[var(--brand-accent)]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[var(--color-success)]" />
        <div className="ml-4 h-6 flex-1 max-w-xs rounded-[var(--radius-sm)] bg-[var(--surface-2)] text-[10px] flex items-center px-3 text-[var(--text-tertiary)]">
          {tab === "workflows" && "app.pytomatiza.com/automations"}
          {tab === "dashboard" && "app.pytomatiza.com/dashboard"}
          {tab === "editor" && "app.pytomatiza.com/automations"}
          {tab === "automations" && "app.pytomatiza.com/automations"}
        </div>
      </div>

      <div className="p-6">
        {tab === "workflows" && <MockupWorkflows />}
        {tab === "dashboard" && <MockupDashboard />}
        {tab === "editor" && <MockupEditor />}
        {tab === "automations" && <MockupAutomations />}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   WORKFLOWS — Mostra fluxo real com steps, ferramentas e status
   ═══════════════════════════════════════════════════════════════════ */

function MockupWorkflows() {
  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2 mb-1">
        <GitBranch className="h-4 w-4 text-[var(--brand-accent)]" />
        <span className="text-xs font-semibold text-[var(--text-primary)]">Workflows ativos</span>
        <span className="ml-auto text-[10px] text-[var(--text-tertiary)]">3 de 8 executando</span>
      </div>

      {/* Workflow card 1 — real content */}
      <div className="rounded-[var(--radius-md)] border border-[var(--brand-accent)]/30 bg-[var(--brand-accent-light)] p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Processamento de Faturas PDF</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Quando um e-mail com PDF chegar, extraia os dados, salve no Drive e notifique no Slack.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--color-success)]">
            <CheckCircle className="h-2.5 w-2.5" /> Ativo
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { tool: "gmail", label: "Gmail", color: "#EA4335" },
            { tool: "ocr", label: "OCR", color: "#8B5CF6" },
            { tool: "drive", label: "Drive", color: "#4285F4" },
            { tool: "slack", label: "Slack", color: "#4A154B" },
          ].map((step, i) => (
            <React.Fragment key={step.tool}>
              {i > 0 && <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />}
              <span
                className="inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: step.color }}
              >
                {step.label}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-[var(--text-tertiary)]">
          Última execução: hoje às 09:45 • 12 faturas processadas
        </div>
      </div>

      {/* Workflow card 2 */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Relatório Semanal de Vendas</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Toda segunda-feira, compile dados do Sheets, gere PDF e envie por e-mail para a diretoria.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--brand-accent)]/10 px-2 py-0.5 text-[10px] font-medium text-[var(--brand-accent)]">
            <RefreshCw className="h-2.5 w-2.5" /> Agendado
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { tool: "sheets", label: "Sheets", color: "#34A853" },
            { tool: "openai", label: "IA Gemini", color: "#8E6CAB" },
            { tool: "gmail", label: "E-mail", color: "#EA4335" },
          ].map((step, i) => (
            <React.Fragment key={step.tool}>
              {i > 0 && <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />}
              <span
                className="inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: step.color }}
              >
                {step.label}
              </span>
            </React.Fragment>
          ))}
        </div>
        <div className="mt-2 text-[10px] text-[var(--text-tertiary)]">
          Próxima execução: segunda, 08:00 • 4 semanas consecutivas
        </div>
      </div>

      {/* Workflow card 3 */}
      <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 opacity-60">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="text-sm font-semibold text-[var(--text-primary)]">Monitoramento de Redes Sociais</p>
            <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
              Monitore menções no Twitter e Instagram, classifique sentimento e responda automaticamente.
            </p>
          </div>
          <span className="shrink-0 inline-flex items-center gap-1 rounded-full bg-[var(--surface-2)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
            <Clock className="h-2.5 w-2.5" /> Pausado
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {[
            { tool: "social", label: "Twitter", color: "#1DA1F2" },
            { tool: "openai", label: "IA Análise", color: "#8E6CAB" },
            { tool: "discord", label: "Discord", color: "#5865F2" },
          ].map((step, i) => (
            <React.Fragment key={step.tool}>
              {i > 0 && <ArrowRight className="h-3 w-3 text-[var(--text-tertiary)]" />}
              <span
                className="inline-flex items-center rounded-[var(--radius-sm)] px-2 py-0.5 text-[10px] font-medium text-white"
                style={{ backgroundColor: step.color }}
              >
                {step.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD — Métricas reais com KPIs, agentes e atividade recente
   ═══════════════════════════════════════════════════════════════════ */

function MockupDashboard() {
  return (
    <div className="space-y-5">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-[var(--text-primary)]">Bom dia, Lucas</p>
          <p className="text-[11px] text-[var(--text-secondary)]">Visão geral dos seus agentes e automações</p>
        </div>
        <span className="text-[10px] text-[var(--text-tertiary)]">18 Jun 2026</span>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Agentes ativos", value: "8", icon: Bot, color: "var(--brand-accent)", trend: "+2" },
          { label: "Automações hoje", value: "47", icon: Zap, color: "var(--color-warning)", trend: "+12%" },
          { label: "Taxa de sucesso", value: "98.3%", icon: TrendingUp, color: "var(--color-success)", trend: "+0.5%" },
          { label: "Pendentes", value: "3", icon: Clock, color: "var(--color-danger)", trend: "-1" },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)]" style={{ backgroundColor: `${stat.color}18` }}>
                <stat.icon className="h-3 w-3" style={{ color: stat.color }} />
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)]">{stat.label}</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[var(--text-primary)]">{stat.value}</span>
              <span className="text-[10px] text-[var(--color-success)]">{stat.trend}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Agent activity */}
      <div>
        <p className="text-xs font-semibold text-[var(--text-primary)] mb-2">Atividade recente</p>
        <div className="grid grid-cols-3 gap-3">
          {[
            { name: "Processador de Faturas", type: "Dados", status: "running", lastRun: "09:45", count: "12 docs" },
            { name: "Gerador de Relatórios", type: "Conteúdo", status: "idle", lastRun: "07:00", count: "1 relatório" },
            { name: "Verificador de APIs", type: "Admin", status: "running", lastRun: "agora", count: "156 pings" },
          ].map((agent) => (
            <div key={agent.name} className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className={cn(
                  "inline-block h-2 w-2 rounded-full",
                  agent.status === "running" ? "bg-[var(--color-success)]" : "bg-[var(--text-tertiary)]"
                )} />
                <span className="text-xs font-medium text-[var(--text-primary)] truncate">{agent.name}</span>
              </div>
              <div className="text-[10px] text-[var(--text-tertiary)]">
                {agent.type} • Última: {agent.lastRun}
              </div>
              <div className="mt-1.5 inline-flex items-center rounded-[var(--radius-sm)] bg-[var(--surface-1)] px-2 py-0.5 text-[10px] text-[var(--text-secondary)]">
                {agent.count}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   EDITOR — Mantido o existente (já tem conteúdo razoável)
   ═══════════════════════════════════════════════════════════════════ */

function MockupEditor() {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-[var(--brand-accent)]" />
        <div className="h-3 w-24 rounded bg-[var(--surface-2)]" />
      </div>
      <div className="space-y-2 rounded-[var(--radius-md)] bg-[var(--surface-1)] p-4 font-mono text-sm">
        {[
          "trigger: email.received",
          "  condition: subject.contains('invoice')",
          "  actions:",
          "    - extract.attachments",
          "    - save.to('google/drive/invoices')",
          "    - notify.slack('#finance')",
        ].map((line, i) => (
          <div key={i} className="flex">
            <span className="w-6 text-[var(--text-tertiary)]">{i + 1}</span>
            <span className={i === 0 ? "text-[var(--brand-accent)]" : "text-[var(--text-secondary)]"}>{line}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   AUTOMATIONS — Runs reais com integrações, datas e status
   ═══════════════════════════════════════════════════════════════════ */

function MockupAutomations() {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-semibold text-[var(--text-primary)]">Execuções recentes</span>
        <span className="text-[10px] text-[var(--text-tertiary)]">Últimas 24 horas</span>
      </div>

      {[
        {
          name: "Processar Faturas — Lote #142",
          workflow: "Processamento de Faturas PDF",
          status: "success",
          time: "09:45",
          duration: "2.3s",
          integrations: ["gmail", "ocr", "drive", "slack"],
        },
        {
          name: "Gerar Relatório Semanal",
          workflow: "Relatório Semanal de Vendas",
          status: "success",
          time: "07:00",
          duration: "8.7s",
          integrations: ["sheets", "openai", "gmail"],
        },
        {
          name: "Notificar Equipe — Bug Crítico",
          workflow: "Monitoramento de Erros",
          status: "success",
          time: "06:32",
          duration: "0.4s",
          integrations: ["discord", "jira"],
        },
        {
          name: "Backup Noturno — DB Principal",
          workflow: "Backup Automático",
          status: "success",
          time: "02:00",
          duration: "45.1s",
          integrations: ["database"],
        },
        {
          name: "Sincronizar Contatos — CRM",
          workflow: "Sincronização CRM ↔ Sheets",
          status: "failed",
          time: "01:15",
          duration: "12.0s",
          error: "Timeout na API do CRM após 10s",
          integrations: ["sheets", "api"],
        },
      ].map((run, i) => {
        const colors: Record<string, string> = {
          gmail: "#EA4335", ocr: "#8B5CF6", drive: "#4285F4", slack: "#4A154B",
          sheets: "#34A853", openai: "#8E6CAB", discord: "#5865F2", jira: "#0052CC",
          database: "#F29111", api: "#6366F1",
        };
        return (
          <div
            key={i}
            className={cn(
              "rounded-[var(--radius-md)] border p-3",
              run.status === "failed"
                ? "border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5"
                : "border-[var(--border-default)]"
            )}
          >
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-2 min-w-0">
                <span className={cn(
                  "h-2.5 w-2.5 rounded-full shrink-0",
                  run.status === "success" ? "bg-[var(--color-success)]" : "bg-[var(--color-danger)]"
                )} />
                <span className="text-xs font-medium text-[var(--text-primary)] truncate">{run.name}</span>
              </div>
              <span className="text-[10px] text-[var(--text-tertiary)] shrink-0 ml-2">{run.time}</span>
            </div>
            <div className="flex items-center gap-1 flex-wrap mb-1.5">
              {run.integrations.map((tool) => (
                <span
                  key={tool}
                  className="inline-flex items-center rounded-[var(--radius-sm)] px-1.5 py-0.5 text-[9px] font-medium text-white"
                  style={{ backgroundColor: colors[tool] || "#666" }}
                >
                  {tool}
                </span>
              ))}
            </div>
            <div className={cn(
              "text-[10px]",
              run.status === "success" ? "text-[var(--text-tertiary)]" : "text-[var(--color-danger)]"
            )}>
              {run.status === "success"
                ? `${run.workflow} • ${run.duration}`
                : run.error
              }
            </div>
          </div>
        );
      })}
    </div>
  );
}

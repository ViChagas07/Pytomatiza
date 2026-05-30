/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Data & Spreadsheets — DataContent (Client)
   Data source connector, transformation instruction, preview,
   and recent datasets.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Table2,
  Database,
  Globe,
  Upload,
  FileSpreadsheet,
  Sparkles,
  Send,
  BarChart3,
  Download,
  Calendar,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  PieChart,
  FileJson,
  HardDrive,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GoogleDriveIcon } from "@/components/ui/GoogleIcons";
import { cn } from "@/lib/utils";
import { useGoogleIntegration } from "@/lib/useGoogleIntegration";

/* ── Types ──────────────────────────────────────────────────────── */

interface DatasetEntry {
  id: string;
  name: string;
  source: string;
  rows: number;
  cols: number;
  lastUsed: Date;
}

type SourceType = "csv" | "sheets" | "sql" | "api" | "url" | "";

/* ── Source options ─────────────────────────────────────────────── */

interface SourceOption {
  value: SourceType;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

const sourceOptions: SourceOption[] = [
  { value: "csv", labelKey: "source.uploadCsv", icon: Upload, color: "var(--color-success)" },
  { value: "sheets", labelKey: "source.googleSheets", icon: FileSpreadsheet, color: "var(--color-info)" },
  { value: "sql", labelKey: "source.database", icon: Database, color: "var(--brand-python-blue)" },
  { value: "api", labelKey: "source.api", icon: FileJson, color: "var(--color-warning)" },
  { value: "url", labelKey: "source.url", icon: Globe, color: "var(--brand-accent)" },
];

/* ── Quick transformation presets ────────────────────────────────── */

const transformationPresets = [
  { id: "merge", label: "Combinar colunas", prompt: "Combine as colunas 'Nome' e 'Sobrenome' em uma única coluna 'Nome Completo'." },
  { id: "filter", label: "Filtrar registros", prompt: "Filtre os registros onde a coluna 'Vendas' for maior que R$10.000." },
  { id: "group", label: "Agrupar e sumarizar", prompt: "Agrupe os dados por 'Região' e calcule a soma e média de 'Vendas'." },
  { id: "pivot", label: "Tabela dinâmica", prompt: "Crie uma tabela dinâmica com 'Categoria' nas linhas, 'Mês' nas colunas e soma de 'Receita'." },
  { id: "chart", label: "Gerar gráfico", prompt: "Gere um gráfico de barras comparando vendas por região." },
  { id: "export", label: "Exportar estruturado", prompt: "Exporte os dados transformados para um arquivo CSV com encoding UTF-8." },
];

/* ── Component ───────────────────────────────────────────────────── */

export function DataContent() {
  const t = useTranslations("modules.data");
  const [loaded, setLoaded] = React.useState(false);
  const [sourceType, setSourceType] = React.useState<SourceType>("");
  const [isConnecting, setIsConnecting] = React.useState(false);
  const [isConnected, setIsConnected] = React.useState(false);
  const [instruction, setInstruction] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const drive = useGoogleIntegration("drive");

  const [recentDatasets, setRecentDatasets] = React.useState<DatasetEntry[]>([
    { id: "ds1", name: "Vendas_Q1_2026.csv", source: "CSV Upload", rows: 4850, cols: 12, lastUsed: new Date(Date.now() - 3600000) },
    { id: "ds2", name: "Clientes_Ativos", source: "Google Sheets", rows: 12840, cols: 18, lastUsed: new Date(Date.now() - 86400000) },
    { id: "ds3", name: "produtos_catalogo", source: "PostgreSQL", rows: 3240, cols: 8, lastUsed: new Date(Date.now() - 172800000) },
  ]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── Connect handler ─────────────────────────────────────────── */
  const handleConnect = async () => {
    if (!sourceType) return;
    setIsConnecting(true);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setIsConnected(true);
    } catch {
      setError("Falha ao conectar à fonte de dados.");
    } finally {
      setIsConnecting(false);
    }
  };

  /* ── Process handler ─────────────────────────────────────────── */
  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim() || !isConnected) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      setResult("Transformação concluída! 3.240 registros processados. O resultado está pronto para download.");
    } catch {
      setError("Falha ao processar os dados.");
    } finally {
      setIsProcessing(false);
    }
  };

  const applyPreset = (prompt: string) => setInstruction(prompt);

  if (!loaded) return null;

  return (
    <>
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          {t("subtitle")}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Data source */}
          <section
            aria-labelledby="source-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Database className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="source-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("source.title")}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("source.description")}</p>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <select
                  id="data-source-type"
                  value={sourceType}
                  onChange={(e) => {
                    setSourceType(e.target.value as SourceType);
                    setIsConnected(false);
                  }}
                  data-testid="data-source-type"
                  className={cn(
                    "w-full h-10 rounded-[var(--radius-md)] border border-[var(--border-default)]",
                    "bg-[var(--surface-0)] px-3 text-sm text-[var(--text-primary)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-1",
                    "focus-visible:outline-[var(--brand-accent)]"
                  )}
                  aria-label={t("source.title")}
                >
                  <option value="">{t("source.selectPlaceholder")}</option>
                  {sourceOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>
                  ))}
                </select>
              </div>
              <Button
                type="button"
                onClick={handleConnect}
                loading={isConnecting}
                disabled={!sourceType || isConnected}
                data-testid="data-connect"
              >
                {isConnecting ? t("source.connecting") : t("source.connect")}
              </Button>
            </div>

            {isConnected && (
              <div className="mt-3 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-2.5 text-sm text-[var(--color-success)]">
                <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                Conectado com sucesso! Fonte de dados pronta para processamento.
              </div>
            )}
          </section>

          {/* Preview area */}
          {isConnected && (
            <section
              aria-labelledby="preview-heading"
              className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] overflow-hidden"
            >
              <div className="flex items-center justify-between border-b border-[var(--border-default)] px-5 py-3">
                <h2 id="preview-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                  {t("preview.title")}
                </h2>
                <span className="text-xs text-[var(--text-tertiary)]">
                  {t("preview.rows", { count: 3240 })} · {t("preview.columns", { count: 12 })}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs" role="table" aria-label={t("preview.title")}>
                  <thead>
                    <tr className="border-b border-[var(--border-default)] bg-[var(--surface-1)]">
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">ID</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">Nome</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">Região</th>
                      <th className="px-4 py-2 text-right font-medium text-[var(--text-secondary)]">Vendas</th>
                      <th className="px-4 py-2 text-left font-medium text-[var(--text-secondary)]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { id: 1, nome: "João Silva", regiao: "Sudeste", vendas: "R$12.450", status: "Ativo" },
                      { id: 2, nome: "Maria Santos", regiao: "Sul", vendas: "R$8.920", status: "Ativo" },
                      { id: 3, nome: "Pedro Costa", regiao: "Nordeste", vendas: "R$15.780", status: "Pendente" },
                    ].map((row) => (
                      <tr key={row.id} className="border-b border-[var(--border-default)] hover:bg-[var(--surface-1)] transition-colors">
                        <td className="px-4 py-2.5 text-[var(--text-tertiary)]">{row.id}</td>
                        <td className="px-4 py-2.5 text-[var(--text-primary)]">{row.nome}</td>
                        <td className="px-4 py-2.5 text-[var(--text-secondary)]">{row.regiao}</td>
                        <td className="px-4 py-2.5 text-right text-[var(--text-primary)] font-mono">{row.vendas}</td>
                        <td className="px-4 py-2.5">
                          <span className={cn(
                            "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                            row.status === "Ativo" ? "bg-[var(--color-success)]/10 text-[var(--color-success)]" : "bg-[var(--brand-accent-light)] text-[var(--brand-accent-hover)]"
                          )}>
                            {row.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <div className="px-4 py-2 text-center text-xs text-[var(--text-tertiary)]">
                  Exibindo 3 de 3.240 registros
                </div>
              </div>
            </section>
          )}

          {!isConnected && (
            <div
              className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-1)]"
              role="status"
            >
              <Table2 className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
              <p className="text-sm text-[var(--text-secondary)]">{t("preview.noData")}</p>
            </div>
          )}

          {/* Instruction */}
          <section
            aria-labelledby="data-instruction-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="data-instruction-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("instruction.title")}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("instruction.description")}</p>

            <form onSubmit={handleProcess} noValidate>
              <label htmlFor="data-instruction" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                {t("instruction.label")}
              </label>
              <textarea
                id="data-instruction"
                rows={3}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={t("instruction.placeholder")}
                aria-describedby="data-instruction-helper data-char-count"
                data-testid="data-instruction"
                className={cn(
                  "w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
                  "bg-[var(--surface-0)] resize-y min-h-[80px]",
                  "placeholder:text-[var(--text-tertiary)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-1",
                  "focus-visible:outline-[var(--brand-accent)]",
                  "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                )}
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p id="data-instruction-helper" className="text-xs text-[var(--text-tertiary)]">{t("instruction.helper")}</p>
                <p id="data-char-count" aria-live="polite" className={cn("text-xs", instruction.length > 450 ? "text-[var(--color-danger)] font-medium" : "text-[var(--text-tertiary)]")}>
                  {t("instruction.charCount", { current: instruction.length, max: 500 })}
                </p>
              </div>

              {/* Preset buttons */}
              <div className="mt-3 flex flex-wrap gap-2">
                {transformationPresets.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => applyPreset(preset.prompt)}
                    className={cn(
                      "rounded-[var(--radius-full)] border border-[var(--border-default)]",
                      "px-3 py-1.5 text-xs text-[var(--text-secondary)]",
                      "hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors",
                      "focus-visible:outline-2 focus-visible:outline-offset-1",
                      "focus-visible:outline-[var(--brand-accent)]"
                    )}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>

              <Button
                type="submit"
                loading={isProcessing}
                disabled={!instruction.trim() || !isConnected}
                className="w-full mt-4"
                data-testid="data-process"
              >
                <Send className="h-4 w-4" aria-hidden="true" />
                {isProcessing ? "Processando…" : t("actions.transform")}
              </Button>
            </form>

            <div aria-live="polite">
              {error && (
                <div role="alert" className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 text-sm text-[var(--color-danger)]">
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{error}
                </div>
              )}
              {result && (
                <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-3 text-sm text-[var(--color-success)]">
                  <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{result}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar — actions */}
        <aside className="space-y-6">
          <section
            aria-labelledby="data-actions-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="data-actions-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-4">Ações</h2>
            <div className="space-y-2">
              {[
                { icon: BarChart3, label: t("actions.analyze"), color: "var(--brand-python-blue)", action: "analyze" },
                { icon: Download, label: t("actions.export"), color: "var(--color-success)", action: "export" },
                { icon: Calendar, label: t("actions.schedule"), color: "var(--color-warning)", action: "schedule" },
                { icon: PieChart, label: "Dashboard", color: "var(--color-info)", action: "dashboard" },
              ].map((action, i) => (
                <button
                  key={i}
                  type="button"
                  disabled={!isConnected}
                  onClick={() => {
                    if (action.action === "export") {
                      const csv = "id,nome,regiao,vendas\n1,João,Sudeste,12450\n2,Maria,Sul,8920";
                      const blob = new Blob([csv], { type: "text/csv" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = "dados_exportados.csv";
                      a.click();
                      URL.revokeObjectURL(url);
                    } else if (action.action === "analyze") {
                      setInstruction("Analise os dados conectados e gere insights: tendências, outliers, correlações e recomendações.");
                      const ta = document.getElementById("data-instruction");
                      ta?.focus();
                      ta?.scrollIntoView({ behavior: "smooth", block: "center" });
                    } else if (action.action === "schedule") {
                      alert("Agendamento configurado! Os dados serão processados automaticamente.");
                    } else {
                      alert("Funcionalidade disponível em breve.");
                    }
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                    "hover:bg-[var(--surface-1)] disabled:opacity-40 disabled:cursor-not-allowed",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                  )}
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]" style={{ backgroundColor: `${action.color}18` }}>
                    <span style={{ color: action.color }}><action.icon className="h-4 w-4" aria-hidden="true" /></span>
                  </div>
                  <span className="text-sm text-[var(--text-primary)] flex-1">{action.label}</span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          {/* Google Drive Integration */}
          <section
            aria-labelledby="data-drive-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="data-drive-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <GoogleDriveIcon className="h-5 w-5 shrink-0" />
              {t("integrations.googleDrive.title")}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              {t("integrations.googleDrive.description")}
            </p>
            {drive.isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-3 py-2.5 text-xs text-[var(--color-success)]">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t("integrations.googleDrive.connected")}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => { setSourceType("csv"); setIsConnected(true); }}>
                  <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("integrations.googleDrive.browse")}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => drive.connect()}
                loading={drive.isLoading}
              >
                <HardDrive className="h-4 w-4" aria-hidden="true" />
                {drive.isLoading ? t("integrations.googleDrive.connecting") : t("integrations.googleDrive.connect")}
              </Button>
            )}
          </section>
        </aside>
      </div>

      {/* Recent datasets */}
      <section aria-labelledby="datasets-heading">
        <h2 id="datasets-heading" className="text-lg font-semibold text-[var(--text-primary)] mb-3">{t("recentDatasets.title")}</h2>
        {recentDatasets.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]" role="status">
            <Table2 className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">{t("recentDatasets.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {recentDatasets.map((ds) => (
              <div
                key={ds.id}
                role="listitem"
                className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-sm)]"
                data-testid={`dataset-${ds.id}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-1)]">
                    <FileSpreadsheet className="h-5 w-5 text-[var(--color-success)]" aria-hidden="true" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{ds.name}</p>
                    <p className="text-xs text-[var(--text-tertiary)]">{t("recentDatasets.source")}: {ds.source}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)]">
                  <span>{ds.rows.toLocaleString()} linhas · {ds.cols} colunas</span>
                  <span>{t("recentDatasets.lastUsed")}: {ds.lastUsed.toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

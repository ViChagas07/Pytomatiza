/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Architecture — ArchitectureContent (Client)
   AI-powered diagram generator: description input, template
   selector, export format picker, and recent diagrams.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Layers,
  Sparkles,
  Send,
  Cloud,
  Monitor,
  Container,
  Box,
  Zap,
  GitBranch,
  Network,
  ArrowLeftRight,
  Download,
  Pencil,
  Trash2,
  FileImage,
  FileCode,
  FileText,
  Share2,
  CheckCircle,
  AlertTriangle,
  GitGraph,
  Cpu,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ── Types ──────────────────────────────────────────────────────── */

interface TemplateDef {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface ExportFormat {
  id: string;
  labelKey: string;
  icon: React.ComponentType<{ className?: string }>;
  extension: string;
}

interface DiagramEntry {
  id: string;
  name: string;
  template: string;
  components: number;
  format: string;
  createdAt: Date;
}

/* ── Templates ──────────────────────────────────────────────────── */

const templates: TemplateDef[] = [
  { id: "aws", labelKey: "templates.aws", icon: Cloud, color: "var(--color-warning)" },
  { id: "gcp", labelKey: "templates.gcp", icon: Cloud, color: "var(--brand-python-blue)" },
  { id: "azure", labelKey: "templates.azure", icon: Cloud, color: "var(--color-info)" },
  { id: "microservices", labelKey: "templates.microservices", icon: Container, color: "var(--color-success)" },
  { id: "serverless", labelKey: "templates.serverless", icon: Zap, color: "var(--brand-accent)" },
  { id: "eventDriven", labelKey: "templates.eventDriven", icon: ArrowLeftRight, color: "var(--color-danger)" },
  { id: "ciCd", labelKey: "templates.ciCd", icon: GitBranch, color: "var(--color-success)" },
  { id: "network", labelKey: "templates.network", icon: Network, color: "var(--brand-python-blue)" },
  { id: "dataPipeline", labelKey: "templates.dataPipeline", icon: GitGraph, color: "var(--text-tertiary)" },
  { id: "monolith", labelKey: "templates.monolith", icon: Box, color: "var(--color-warning)" },
];

/* ── Export formats ─────────────────────────────────────────────── */

const exportFormats: ExportFormat[] = [
  { id: "png", labelKey: "export.png", icon: FileImage, extension: ".png" },
  { id: "svg", labelKey: "export.svg", icon: FileCode, extension: ".svg" },
  { id: "pdf", labelKey: "export.pdf", icon: FileText, extension: ".pdf" },
  { id: "terraform", labelKey: "export.terraform", icon: Cpu, extension: ".tf" },
];

/* ── Component ───────────────────────────────────────────────────── */

export function ArchitectureContent() {
  const t = useTranslations("modules.architecture");
  const [loaded, setLoaded] = React.useState(false);
  const [instruction, setInstruction] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<string | null>(null);
  const [selectedExport, setSelectedExport] = React.useState<string>("png");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const [diagrams, setDiagrams] = React.useState<DiagramEntry[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2500));

      const templateName = selectedTemplate
        ? t(templates.find((tmpl) => tmpl.id === selectedTemplate)?.labelKey || "")
        : "Personalizado";
      const fmt = exportFormats.find((f) => f.id === selectedExport);

      setResult(
        `Diagrama de arquitetura "${templateName}" gerado com sucesso em formato ${fmt?.extension || ".png"}!`
      );

      const newDiagram: DiagramEntry = {
        id: `d${Date.now()}`,
        name: instruction.slice(0, 40) + (instruction.length > 40 ? "..." : ""),
        template: selectedTemplate || "custom",
        components: Math.floor(Math.random() * 15) + 3,
        format: fmt?.extension?.toUpperCase().replace(".", "") || "PNG",
        createdAt: new Date(),
      };
      setDiagrams((prev) => [newDiagram, ...prev]);
    } catch {
      setError(t("errors.generateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Diagram actions ─────────────────────────────────────────── */
  const handleDownloadDiagram = (diagram: DiagramEntry) => {
    const content = `Diagrama: ${diagram.name}\nTemplate: ${diagram.template}\nComponentes: ${diagram.components}\nFormato: ${diagram.format}\nCriado: ${diagram.createdAt.toLocaleString()}`;
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = diagram.format.toLowerCase();
    a.download = `${diagram.name.replace(/\s+/g, "_").toLowerCase()}.${ext === "draw.io" ? "drawio" : ext}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleEditDiagram = (diagram: DiagramEntry) => {
    setInstruction(diagram.name);
    setSelectedTemplate(diagram.template !== "custom" ? diagram.template : null);
    const textarea = document.getElementById("arch-instruction");
    textarea?.focus();
    textarea?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDeleteDiagram = (id: string) => {
    if (window.confirm(t("dialogs.deleteConfirm"))) {
      setDiagrams((prev) => prev.filter((d) => d.id !== id));
    }
  };

  const handleShare = () => {
    if (diagrams.length === 0) return;
    alert(t("dialogs.shareLink"));
  };

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

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main — diagram builder */}
        <div className="space-y-6">
          <section
            aria-labelledby="diagram-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Layers className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="diagram-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("diagramBuilder.title")}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("diagramBuilder.description")}</p>

            <form onSubmit={handleGenerate} noValidate>
              <label htmlFor="arch-instruction" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                {t("diagramBuilder.instructionLabel")}
              </label>
              <textarea
                id="arch-instruction"
                rows={5}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={t("diagramBuilder.instructionPlaceholder")}
                aria-describedby="arch-helper arch-char-count"
                data-testid="arch-instruction"
                className={cn(
                  "w-full rounded-[var(--radius-md)] border px-3 py-2.5 text-sm",
                  "bg-[var(--surface-0)] resize-y min-h-[120px]",
                  "placeholder:text-[var(--text-tertiary)]",
                  "focus-visible:outline-2 focus-visible:outline-offset-1",
                  "focus-visible:outline-[var(--brand-accent)]",
                  "border-[var(--border-default)] hover:border-[var(--border-strong)]"
                )}
              />
              <div className="mt-1.5 flex items-center justify-between">
                <p id="arch-helper" className="text-xs text-[var(--text-tertiary)]">{t("diagramBuilder.instructionHelper")}</p>
                <p
                  id="arch-char-count"
                  aria-live="polite"
                  className={cn("text-xs", instruction.length > 900 ? "text-[var(--color-danger)] font-medium" : "text-[var(--text-tertiary)]")}
                >
                  {t("diagramBuilder.charCount", { current: instruction.length, max: 1000 })}
                </p>
              </div>

              <Button
                type="submit"
                loading={isGenerating}
                disabled={!instruction.trim()}
                className="w-full mt-4"
                size="lg"
                data-testid="arch-generate"
              >
                <Sparkles className="h-4 w-4" aria-hidden="true" />
                {isGenerating ? t("actions.generating") : t("actions.generate")}
              </Button>
            </form>

            {/* Result */}
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

        {/* Sidebar — templates + export */}
        <aside className="space-y-6">
          {/* Templates */}
          <section
            aria-labelledby="templates-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="templates-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-1">{t("templates.title")}</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("templates.description")}</p>
            <div className="space-y-1.5" role="radiogroup" aria-label={t("templates.title")}>
              {templates.map((tmpl) => {
                const isSelected = selectedTemplate === tmpl.id;
                return (
                  <button
                    key={tmpl.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedTemplate(isSelected ? null : tmpl.id)}
                    data-testid={`template-${tmpl.id}`}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-all",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]",
                      isSelected
                        ? "border border-[var(--brand-accent)] bg-[var(--brand-accent-light)]"
                        : "border border-transparent hover:bg-[var(--surface-1)]"
                    )}
                  >
                    <div
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
                      style={{ backgroundColor: `${tmpl.color}18` }}
                    >
                      <span style={{ color: tmpl.color }}><tmpl.icon className="h-3.5 w-3.5" aria-hidden="true" /></span>
                    </div>
                    <span className="text-xs text-[var(--text-primary)] flex-1">{t(tmpl.labelKey)}</span>
                    {isSelected && <CheckCircle className="h-3.5 w-3.5 text-[var(--brand-accent)] shrink-0" aria-hidden="true" />}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Export format */}
          <section
            aria-labelledby="export-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="export-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-1">{t("export.title")}</h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("export.description")}</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("export.title")}>
              {exportFormats.map((fmt) => {
                const isSelected = selectedExport === fmt.id;
                return (
                  <button
                    key={fmt.id}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setSelectedExport(fmt.id)}
                    className={cn(
                      "flex flex-col items-center gap-1.5 rounded-[var(--radius-md)] border p-3 text-center transition-all",
                      "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]",
                      isSelected
                        ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)]"
                        : "border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]"
                    )}
                    data-testid={`export-${fmt.id}`}
                  >
                    <fmt.icon
                      className={cn("h-5 w-5", isSelected ? "text-[var(--brand-accent)]" : "text-[var(--text-tertiary)]")}
                      aria-hidden="true"
                    />
                    <span className="text-[10px] font-medium text-[var(--text-secondary)]">{t(fmt.labelKey)}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{fmt.extension}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Additional actions — Share */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleShare}
              aria-disabled={diagrams.length === 0}
              tabIndex={diagrams.length === 0 ? -1 : 0}
              className={cn(
                "flex w-full items-center gap-3 rounded-[var(--radius-lg)] border border-dashed p-4 text-left transition-all",
                diagrams.length > 0
                  ? "border-[var(--border-default)] bg-[var(--surface-1)] hover:bg-[var(--surface-2)] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                  : "border-[var(--border-default)]/60 bg-[var(--surface-1)]/70 opacity-60 cursor-not-allowed"
              )}
            >
              <div
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  diagrams.length > 0
                    ? "bg-[var(--brand-accent-light)]"
                    : "bg-[var(--surface-2)]"
                )}
              >
                <Share2
                  className={cn(
                    "h-5 w-5",
                    diagrams.length > 0
                      ? "text-[var(--brand-accent)]"
                      : "text-[var(--text-tertiary)]"
                  )}
                  aria-hidden="true"
                />
              </div>
              <div>
                <p
                  className={cn(
                    "text-sm font-medium",
                    diagrams.length > 0
                      ? "text-[var(--text-primary)]"
                      : "text-[var(--text-tertiary)]"
                  )}
                >
                  {t("actions.share")}
                </p>
                <p
                  className={cn(
                    "text-xs mt-0.5",
                    diagrams.length > 0
                      ? "text-[var(--text-tertiary)]"
                      : "text-[var(--text-tertiary)]/60"
                  )}
                >
                  {t("actions.shareDescription")}
                </p>
              </div>
            </button>

            {/* Warning when no diagrams exist yet */}
            {diagrams.length === 0 && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-[var(--radius-md)] bg-[var(--color-warning)]/10 border border-[var(--color-warning)]/25 px-3 py-2.5"
              >
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-[var(--color-warning)]" aria-hidden="true" />
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {t("dialogs.shareEmptyWarning")}
                </p>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Recent diagrams */}
      <section aria-labelledby="recent-diagrams-heading">
        <h2 id="recent-diagrams-heading" className="text-lg font-semibold text-[var(--text-primary)] mb-3">{t("recentDiagrams.title")}</h2>
        {diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]" role="status">
            <Layers className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">{t("recentDiagrams.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" role="list">
            {diagrams.map((diagram) => {
              const tmpl = templates.find((t) => t.id === diagram.template);
              const TemplateIcon = tmpl?.icon || Monitor;
              const tmplColor = tmpl?.color || "var(--text-tertiary)";
              return (
                <div
                  key={diagram.id}
                  role="listitem"
                  className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] overflow-hidden group"
                >
                  {/* Preview */}
                  <div className="h-32 bg-[var(--surface-1)] flex items-center justify-center relative">
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Layers className="h-12 w-12 text-[var(--border-default)]" aria-hidden="true" />
                    </div>
                    <div
                      className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium bg-[var(--surface-0)]/90 border border-[var(--border-default)]"
                    >
                      <span style={{ color: tmplColor }}><TemplateIcon className="h-3 w-3" aria-hidden="true" /></span>
                      <span className="text-[var(--text-secondary)]">
                        {tmpl ? t(tmpl.labelKey) : "Custom"}
                      </span>
                    </div>
                    <div className="absolute top-3 right-3 inline-flex items-center rounded-full bg-[var(--surface-0)]/90 border border-[var(--border-default)] px-2 py-0.5 text-[10px] font-medium text-[var(--text-tertiary)]">
                      {diagram.format}
                    </div>
                  </div>
                  <div className="p-4">
                    <p className="text-sm font-medium text-[var(--text-primary)] truncate">{diagram.name}</p>
                    <div className="mt-1.5 flex items-center justify-between">
                      <span className="text-xs text-[var(--text-tertiary)]">
                        {t("recentDiagrams.components", { count: diagram.components })} · {t("recentDiagrams.createdAt")}: {diagram.createdAt.toLocaleDateString()}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleDownloadDiagram(diagram)}
                        aria-label={t("recentDiagrams.download")}
                        className="flex-1 inline-flex items-center justify-center gap-1 rounded-[var(--radius-sm)] bg-[var(--surface-1)] px-3 py-1.5 text-xs text-[var(--text-secondary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                      >
                        <Download className="h-3.5 w-3.5" aria-hidden="true" />{t("recentDiagrams.download")}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleEditDiagram(diagram)}
                        aria-label={t("recentDiagrams.edit")}
                        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-1)] p-1.5 text-xs text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                      >
                        <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteDiagram(diagram.id)}
                        aria-label={t("recentDiagrams.delete")}
                        className="inline-flex items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-1)] p-1.5 text-xs text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--color-danger)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                      >
                        <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}

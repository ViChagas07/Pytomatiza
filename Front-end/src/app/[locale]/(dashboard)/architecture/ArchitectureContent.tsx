/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Architecture — AI‑powered diagram generator (Gemini)
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import mermaid from "mermaid";
import {
  Layers,
  Sparkles,
  Send,
  Cloud,
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
  Maximize2,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { LoginOverlay } from "@/components/ui/LoginOverlay";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";
import { SiJira, SiTrello } from "react-icons/si";

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
  mermaid: string;
  template: string;
  components: number;
  format: string;
  description: string;
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

// Init mermaid once
mermaid.initialize({ startOnLoad: false, theme: "default", securityLevel: "loose" });

/* ── Component ───────────────────────────────────────────────────── */

export function ArchitectureContent() {
  const t = useTranslations("modules.architecture");
  const [loaded, setLoaded] = React.useState(false);
  const [instruction, setInstruction] = React.useState("");
  const [selectedTemplate, setSelectedTemplate] = React.useState<string>("aws");
  const [selectedExport, setSelectedExport] = React.useState<string>("mermaid");
  const [isGenerating, setIsGenerating] = React.useState(false);
  const [result, setResult] = React.useState<DiagramEntry | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [expandedDiagram, setExpandedDiagram] = React.useState<string | null>(null);

  const [diagrams, setDiagrams] = React.useState<DiagramEntry[]>([]);
  const mermaidRefs = React.useRef<Map<string, HTMLDivElement>>(new Map());

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 400);
    return () => clearTimeout(timer);
  }, []);

  /* ── Render mermaid diagrams after they mount ────────────────── */
  React.useEffect(() => {
    diagrams.forEach(async (d) => {
      const el = mermaidRefs.current.get(d.id);
      if (el && d.mermaid) {
        try {
          const { svg } = await mermaid.render(`mermaid-${d.id}`, d.mermaid);
          el.innerHTML = svg;
        } catch {
          el.innerHTML = `<p class="text-xs text-[var(--text-tertiary)] p-4">Diagrama não pôde ser renderizado.</p>`;
        }
      }
    });
  }, [diagrams]);

  /* ── Generate via Gemini ─────────────────────────────────────── */
  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!instruction.trim()) return;

    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.generateArchitecture(
        instruction,
        selectedTemplate || "aws",
        selectedExport || "mermaid"
      );

      if (res.error || !res.data?.mermaid) {
        setError(res.error?.message || t("errors.generateFailed"));
        return;
      }

      const entry: DiagramEntry = {
        id: `arch-${Date.now()}`,
        name: res.data.title || instruction.slice(0, 60),
        mermaid: res.data.mermaid,
        template: selectedTemplate || "aws",
        components: res.data.component_count,
        format: selectedExport || "mermaid",
        description: res.data.description || "",
        createdAt: new Date(),
      };

      setResult(entry);
      setDiagrams((prev) => [entry, ...prev]);
    } catch {
      setError(t("errors.generateFailed"));
    } finally {
      setIsGenerating(false);
    }
  };

  /* ── Export ──────────────────────────────────────────────────── */
  const handleDownload = (diagram: DiagramEntry) => {
    if (diagram.format === "mermaid" || diagram.format === "terraform") {
      // Text-based export
      const content = diagram.format === "terraform"
        ? `# Terraform generated by Pytomatiza+ Architecture\n# ${diagram.name}\n\n${diagram.mermaid}`
        : diagram.mermaid;
      const blob = new Blob([content], { type: "text/plain" });
      downloadBlob(blob, diagram.name + (diagram.format === "terraform" ? ".tf" : ".mmd"));
      return;
    }

    // SVG/PNG: extract from rendered mermaid
    const el = mermaidRefs.current.get(diagram.id);
    if (!el) return;
    const svgEl = el.querySelector("svg");
    if (!svgEl) return;

    if (diagram.format === "svg") {
      const blob = new Blob([svgEl.outerHTML], { type: "image/svg+xml" });
      downloadBlob(blob, diagram.name + ".svg");
    } else {
      // PNG via canvas
      const svgData = new XMLSerializer().serializeToString(svgEl);
      const canvas = document.createElement("canvas");
      const rect = svgEl.getBoundingClientRect();
      canvas.width = rect.width * 2;
      canvas.height = rect.height * 2;
      const ctx = canvas.getContext("2d")!;
      const img = new Image();
      img.onload = () => {
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) downloadBlob(blob, diagram.name + ".png");
        });
      };
      img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
    }
  };

  const handleEdit = (diagram: DiagramEntry) => {
    setInstruction(diagram.name);
    setSelectedTemplate(diagram.template);
    setResult(null);
    setError(null);
    document.getElementById("arch-instruction")?.focus();
    document.getElementById("arch-instruction")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDelete = (id: string) => {
    setDiagrams((prev) => prev.filter((d) => d.id !== id));
    if (result?.id === id) setResult(null);
  };

  const handleShare = (diagram: DiagramEntry) => {
    const text = `Diagrama de Arquitetura: ${diagram.name}\n${diagram.description}\nGerado pelo Pytomatiza+`;
    navigator.clipboard.writeText(text).then(() => alert(t("actions.copied") || "Copiado!"));
  };

  if (!loaded) return null;

  return (
    <LoginOverlay label={t("loginPrompt")}>
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--text-primary)]">{t("title")}</h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{t("subtitle")}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        {/* Main */}
        <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
              <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" />
            </div>
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">{t("diagramBuilder.title")}</h2>
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
              maxLength={1000}
              className="w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 py-2.5 text-sm resize-y min-h-[100px] placeholder:text-[var(--text-tertiary)] focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
            />
            <div className="mt-1.5 flex items-center justify-between">
              <p className="text-xs text-[var(--text-tertiary)]">{t("diagramBuilder.instructionHelper")}</p>
              <p className={cn("text-xs", instruction.length > 900 ? "text-[var(--color-danger)]" : "text-[var(--text-tertiary)]")}>
                {t("diagramBuilder.charCount", { current: instruction.length, max: 1000 })}
              </p>
            </div>

            <Button type="submit" loading={isGenerating} disabled={!instruction.trim()} className="w-full mt-4">
              <Send className="h-4 w-4" />
              {isGenerating ? "Gerando com Gemini..." : t("diagramBuilder.generate") || "Gerar diagrama"}
            </Button>
          </form>

          {/* Result */}
          <div aria-live="polite">
            {error && (
              <div role="alert" className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 text-sm text-[var(--color-danger)]">
                <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
              </div>
            )}
            {result && (
              <div className="mt-4 space-y-3">
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-3 text-sm text-[var(--color-success)]">
                  <CheckCircle className="h-4 w-4 shrink-0" />
                  {result.description || t("diagramBuilder.success") || "Diagrama gerado!"}
                  <span className="text-xs text-[var(--text-tertiary)] ml-auto">{result.components} componentes</span>
                </div>
                {/* Mermaid preview */}
                <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-white overflow-auto p-4">
                  <div ref={(el) => { if (el && result) mermaidRefs.current.set(result.id, el); }} className="flex justify-center" />
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Sidebar */}
        <aside className="space-y-5">
          {/* Templates */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-sm)]">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">{t("templates.title") || "Templates"}</h3>
            <div className="grid grid-cols-2 gap-2">
              {templates.map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => setSelectedTemplate(tmpl.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs transition-all",
                    selectedTemplate === tmpl.id
                      ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] text-[var(--brand-accent)]"
                      : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                  )}
                >
                  <span className={selectedTemplate === tmpl.id ? "text-[var(--brand-accent)]" : ""} style={{ color: selectedTemplate !== tmpl.id ? tmpl.color : undefined }}>
                    <tmpl.icon className="h-3.5 w-3.5 shrink-0" />
                  </span>
                  <span className="truncate">{t(tmpl.labelKey)}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Export format */}
          <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-sm)]">
            <h3 className="text-xs font-semibold text-[var(--text-primary)] mb-3">{t("export.title") || "Exportar como"}</h3>
            <div className="grid grid-cols-2 gap-2">
              {exportFormats.map((fmt) => (
                <button
                  key={fmt.id}
                  type="button"
                  onClick={() => setSelectedExport(fmt.id)}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-xs transition-all",
                    selectedExport === fmt.id
                      ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)] text-[var(--brand-accent)]"
                      : "border-[var(--border-default)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]"
                  )}
                >
                  <fmt.icon className="h-3.5 w-3.5 shrink-0" />
                  <span>{t(fmt.labelKey)}</span>
                  <span className="text-[var(--text-tertiary)] text-[10px]">{fmt.extension}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {/* Recent diagrams */}
      <section>
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t("recentDiagrams.title") || "Diagramas recentes"}</h3>
        {diagrams.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]" role="status">
            <Layers className="h-10 w-10 text-[var(--text-tertiary)] mb-3" />
            <p className="text-sm text-[var(--text-secondary)]">{t("recentDiagrams.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {diagrams.map((d) => (
              <div key={d.id} className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] overflow-hidden group">
                <div className="bg-white p-3 border-b border-[var(--border-default)] min-h-[120px] flex items-center justify-center overflow-hidden">
                  <div
                    ref={(el) => { if (el) mermaidRefs.current.set(d.id, el); }}
                    className="w-full flex justify-center scale-75"
                  />
                </div>
                <div className="p-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium text-[var(--text-primary)] truncate">{d.name}</span>
                    <span className="text-[10px] text-[var(--text-tertiary)]">{d.components} comp.</span>
                  </div>
                  <p className="text-[10px] text-[var(--text-tertiary)] mb-2">{d.createdAt.toLocaleDateString()}</p>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleDownload(d)} className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]" aria-label="Download"><Download className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleEdit(d)} className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]" aria-label="Edit"><Pencil className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleShare(d)} className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)]" aria-label="Share"><Share2 className="h-3.5 w-3.5" /></button>
                    <button onClick={() => handleDelete(d.id)} className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--color-danger)] ml-auto" aria-label="Delete"><Trash2 className="h-3.5 w-3.5" /></button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>

      {/* ── Integrações disponíveis ───────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Integrações disponíveis</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 opacity-40 grayscale cursor-not-allowed">
            <SiJira size={14} color="#0052CC" />
            <span className="text-xs text-white/50">Jira</span>
            <span className="text-[10px] text-white/30 ml-1">Em breve</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 opacity-40 grayscale cursor-not-allowed">
            <SiTrello size={14} color="#0052CC" />
            <span className="text-xs text-white/50">Trello</span>
            <span className="text-[10px] text-white/30 ml-1">Em breve</span>
          </div>
        </div>
      </section>
    </LoginOverlay>
  );
}

/* ── Helpers ────────────────────────────────────────────────────── */

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

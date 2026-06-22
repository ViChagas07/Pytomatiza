/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Documents — DocumentsContent (Client)
   Drag-and-drop upload zone, AI instruction form, quick actions,
   and recent documents list.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  FileText,
  Upload,
  FileCheck,
  Sparkles,
  Send,
  X,
  File,
  Download,
  RefreshCw,
  Trash2,
  ScanText,
  FileType,
  Combine,
  FileSearch,
  Globe,
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  HardDrive,
  ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GoogleDriveIcon, GmailIcon } from "@/components/ui/GoogleIcons";
import { cn } from "@/lib/utils";
import { useGoogleIntegration } from "@/lib/useGoogleIntegration";
import { LoginOverlay } from "@/components/ui/LoginOverlay";
import { api } from "@/lib/api";

/* ── Types ──────────────────────────────────────────────────────── */

interface RecentDoc {
  id: string;
  name: string;
  type: string;
  size: string;
  processedAt: Date;
  status: "completed" | "processing" | "failed";
}

/* ── Mock quick actions ─────────────────────────────────────────── */

interface QuickActionDef {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  labelKey: string;
  color: string;
}

const quickActions: QuickActionDef[] = [
  { id: "extract", icon: ScanText, labelKey: "quickActions.extractData", color: "var(--brand-python-blue)" },
  { id: "convert", icon: FileType, labelKey: "quickActions.convertFormat", color: "var(--color-success)" },
  { id: "merge", icon: Combine, labelKey: "quickActions.mergeDocs", color: "var(--color-warning)" },
  { id: "ocr", icon: FileSearch, labelKey: "quickActions.ocrScan", color: "var(--color-info)" },
  { id: "summarize", icon: Sparkles, labelKey: "quickActions.summarize", color: "var(--brand-accent)" },
  { id: "translate", icon: Globe, labelKey: "quickActions.translate", color: "var(--color-danger)" },
];

/* ── Component ───────────────────────────────────────────────────── */

export function DocumentsContent() {
  const t = useTranslations("modules.documents");
  const [loaded, setLoaded] = React.useState(false);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [instruction, setInstruction] = React.useState("");
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [processingStage, setProcessingStage] = React.useState("");
  const [result, setResult] = React.useState<string | null>(null);
  const [ocrResult, setOcrResult] = React.useState<{
    text: string;
    confidence: number;
    processing_time: number;
    pages: Array<{ page_number: number; confidence: number }>;
    extracted_fields?: Record<string, unknown> | null;
  } | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const drive = useGoogleIntegration("drive");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [recentDocs, setRecentDocs] = React.useState<RecentDoc[]>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── File handling ───────────────────────────────────────────── */
  const handleFileSelect = (files: FileList | null) => {
    if (files?.[0]) {
      setSelectedFile(files[0]);
      setResult(null);
      setError(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  };

  const removeFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  /* ── Process (real OCR API) ──────────────────────────────────── */
  const handleProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) return;

    setIsProcessing(true);
    setError(null);
    setResult(null);
    setOcrResult(null);

    // ── Progress stages ─────────────────────────────────────────
    const stages = [
      t("processing.stage.uploading"),
      t("processing.stage.ocr"),
      t("processing.stage.extracting"),
      t("processing.stage.analyzing"),
    ];
    let stageIdx = 0;
    setProcessingStage(stages[stageIdx]);
    const stageInterval = setInterval(() => {
      stageIdx = Math.min(stageIdx + 1, stages.length - 1);
      setProcessingStage(stages[stageIdx]);
    }, 1200);

    try {
      const res = await api.ocrExtract(selectedFile, undefined, true);

      clearInterval(stageInterval);
      setProcessingStage("");

      if (res.error) {
        setError(res.error.message);
        return;
      }

      const data = res.data!;
      setOcrResult({
        text: data.text,
        confidence: data.confidence,
        processing_time: data.processing_time,
        pages: data.pages.map((p) => ({
          page_number: p.page_number,
          confidence: p.confidence,
        })),
        extracted_fields: data.extracted_fields as Record<string, unknown> | null,
      });
      setResult(t("processing.success"));

      // Add to recent documents
      const newDoc: RecentDoc = {
        id: `d${Date.now()}`,
        name: selectedFile.name,
        type: selectedFile.name.split(".").pop()?.toUpperCase() || "FILE",
        size: formatSize(selectedFile.size),
        processedAt: new Date(),
        status: "completed",
      };
      setRecentDocs((prev) => [newDoc, ...prev]);
    } catch {
      clearInterval(stageInterval);
      setProcessingStage("");
      setError(t("processing.error"));
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── Quick action handler ────────────────────────────────────── */
  const handleQuickAction = (actionId: string) => {
    if (actionId === "ocr" && selectedFile) {
      // Auto‑trigger OCR processing when file is already selected
      setInstruction(t("quickActions.presets.ocr") || "");
      // Programmatically submit the form
      const form = document.querySelector("form") as HTMLFormElement | null;
      form?.requestSubmit();
      return;
    }

    const presetKeys: Record<string, string> = {
      extract: "quickActions.presets.extract",
      convert: "quickActions.presets.convert",
      merge: "quickActions.presets.merge",
      ocr: "quickActions.presets.ocr",
      summarize: "quickActions.presets.summarize",
      translate: "quickActions.presets.translate",
    };
    setInstruction(t(presetKeys[actionId] || ""));
    const textarea = document.getElementById("doc-instruction");
    textarea?.focus();
    textarea?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  /* ── Recent doc actions ──────────────────────────────────────── */
  const handleDownload = (doc: RecentDoc) => {
    const content = `Conteúdo do documento: ${doc.name}\nProcessado em: ${doc.processedAt.toLocaleString()}`;
    const blob = new Blob([content], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.name.replace(/\.[^.]+$/, "_processado.txt");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleReprocess = (doc: RecentDoc) => {
    setInstruction(t("processing.reprocessInstruction", { name: doc.name }));
    setSelectedFile(null);
    setResult(null);
    setError(null);
    const textarea = document.getElementById("doc-instruction");
    textarea?.focus();
    textarea?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const handleDeleteDoc = (id: string) => {
    if (window.confirm(t("dialogs.deleteConfirm"))) {
      setRecentDocs((prev) => prev.filter((d) => d.id !== id));
    }
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

      <LoginOverlay label={t("loginPrompt")}>
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Upload zone */}
          <section
            aria-labelledby="upload-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Upload className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="upload-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("upload.title")}
              </h2>
            </div>

            <div className="p-5">
              {selectedFile ? (
                /* File selected state */
                <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--brand-accent)] bg-[var(--brand-accent-light)] p-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-white">
                      <File className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {selectedFile.name}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {formatSize(selectedFile.size)} — {t("upload.fileSelected")}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={removeFile}
                    aria-label={t("upload.remove")}
                    className="shrink-0 ml-2 inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-white/60 hover:text-[var(--color-danger)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              ) : (
                /* Drop zone */
                <div
                  role="button"
                  tabIndex={0}
                  aria-label={t("upload.browse")}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      fileInputRef.current?.click();
                    }
                  }}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragOver(true);
                  }}
                  onDragLeave={() => setIsDragOver(false)}
                  onDrop={handleDrop}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed p-10 text-center transition-colors cursor-pointer",
                    isDragOver
                      ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)]"
                      : "border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]"
                  )}
                >
                  <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-1)]">
                    <Upload className="h-6 w-6 text-[var(--text-tertiary)]" aria-hidden="true" />
                  </div>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {isDragOver ? t("upload.dragActive") : t("upload.description")}
                  </p>
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    {t("upload.supportedFormats")}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    {t("upload.maxSize")}
                  </p>
                  <span className="mt-3 inline-flex items-center rounded-[var(--radius-full)] bg-[var(--surface-2)] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition-colors">
                    {t("upload.browse")}
                  </span>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                className="sr-only"
                accept=".pdf,.docx,.xlsx,.pptx,.txt,.csv,.jpg,.jpeg,.png,.webp"
                onChange={(e) => handleFileSelect(e.target.files)}
                data-testid="documents-file-input"
              />
            </div>
          </section>

          {/* Instruction form */}
          <section
            aria-labelledby="instruction-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="instruction-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("instruction.title")}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              {t("instruction.description")}
            </p>

            <form onSubmit={handleProcess} noValidate>
              <label htmlFor="doc-instruction" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
                {t("instruction.label")}
              </label>
              <textarea
                id="doc-instruction"
                rows={3}
                value={instruction}
                onChange={(e) => setInstruction(e.target.value)}
                placeholder={t("instruction.placeholder")}
                aria-describedby="doc-instruction-helper doc-char-count"
                data-testid="documents-instruction"
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
                <p id="doc-instruction-helper" className="text-xs text-[var(--text-tertiary)]">
                  {t("instruction.helper")}
                </p>
                <p
                  id="doc-char-count"
                  aria-live="polite"
                  className={cn(
                    "text-xs",
                    instruction.length > 450 ? "text-[var(--color-danger)] font-medium" : "text-[var(--text-tertiary)]"
                  )}
                >
                  {t("instruction.charCount", { current: instruction.length, max: 500 })}
                </p>
              </div>

              <Button
                type="submit"
                loading={isProcessing}
                disabled={isProcessing || !selectedFile}
                className="w-full mt-4"
                data-testid="documents-process"
              >
                {isProcessing ? (
                  <>
                    <Sparkles className="h-4 w-4 animate-pulse" aria-hidden="true" />
                    {processingStage || t("processing.processing")}
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" aria-hidden="true" />
                    {t("processing.button")}
                  </>
                )}
              </Button>
            </form>

            {/* Result feedback */}
            <div aria-live="polite">
              {error && (
                <div
                  role="alert"
                  className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 px-4 py-3 text-sm text-[var(--color-danger)]"
                  data-testid="documents-error"
                >
                  <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                  {error}
                </div>
              )}
              {result && ocrResult && (
                <div className="mt-4 space-y-3">
                  {/* Success banner */}
                  <div
                    className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-3 text-sm text-[var(--color-success)]"
                    data-testid="documents-result"
                  >
                    <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />
                    {result}
                    <span className="text-xs text-[var(--text-tertiary)] ml-auto">
                      {t("processing.confidence")}: {ocrResult.confidence}% —{" "}
                      {ocrResult.processing_time.toFixed(1)}s
                    </span>
                  </div>

                  {/* Extracted text preview */}
                  <details className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)]">
                    <summary className="px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] cursor-pointer hover:bg-[var(--surface-1)] select-none">
                      {t("processing.extractedText")} ({ocrResult.pages.length}{" "}
                      {ocrResult.pages.length === 1 ? "página" : "páginas"})
                    </summary>
                    <div className="px-4 pb-3">
                      <pre className="text-xs text-[var(--text-secondary)] whitespace-pre-wrap font-mono max-h-48 overflow-y-auto bg-[var(--surface-1)] rounded p-3">
                        {ocrResult.text.slice(0, 2000)}
                        {ocrResult.text.length > 2000 && "\n\n[...]"}
                      </pre>
                    </div>
                  </details>

                  {/* Extracted fields */}
                  {ocrResult.extracted_fields && (
                    <details className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)]" open>
                      <summary className="px-4 py-2.5 text-sm font-medium text-[var(--text-primary)] cursor-pointer hover:bg-[var(--surface-1)] select-none">
                        {t("processing.extractedFields")}
                      </summary>
                      <div className="px-4 pb-3 grid gap-2 sm:grid-cols-2">
                        {Object.entries(ocrResult.extracted_fields).map(([key, value]) => {
                          if (key === "raw_text") return null;
                          const arr = Array.isArray(value) ? value : value ? [value] : [];
                          if (arr.length === 0) return null;
                          return (
                            <div key={key} className="flex flex-col gap-0.5">
                              <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
                                {key.replace(/_/g, " ")}
                              </span>
                              <span className="text-xs font-medium text-[var(--text-primary)]">
                                {arr.join(", ")}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </details>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Sidebar — quick actions */}
        <aside className="space-y-6">
          <section
            aria-labelledby="quick-actions-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="quick-actions-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              {t("quickActions.title")}
            </h2>
            <div className="space-y-2">
              {quickActions.map((action) => (
                <button
                  key={action.id}
                  type="button"
                  onClick={() => handleQuickAction(action.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-[var(--radius-md)] px-3 py-2.5 text-left transition-colors",
                    "hover:bg-[var(--surface-1)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-1",
                    "focus-visible:outline-[var(--brand-accent)]"
                  )}
                  data-testid={`documents-action-${action.id}`}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-sm)]"
                    style={{ backgroundColor: `${action.color}18` }}
                  >
                    <span style={{ color: action.color }}><action.icon className="h-4 w-4" aria-hidden="true" /></span>
                  </div>
                  <span className="text-sm text-[var(--text-primary)] flex-1">
                    {t(action.labelKey)}
                  </span>
                  <ArrowRight className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                </button>
              ))}
            </div>
          </section>

          {/* Google Drive Integration */}
          <section
            aria-labelledby="docs-drive-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="docs-drive-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
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
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
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

      {/* Recent documents */}
      <section aria-labelledby="recent-heading">
        <h2 id="recent-heading" className="text-lg font-semibold text-[var(--text-primary)] mb-3">
          {t("recentDocuments.title")}
        </h2>

        {recentDocs.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]"
            role="status"
          >
            <FileText className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">{t("recentDocuments.empty")}</p>
          </div>
        ) : (
          <div className="space-y-3" role="list" aria-label={t("recentDocuments.title")}>
            {recentDocs.map((doc) => (
              <div
                key={doc.id}
                role="listitem"
                className="flex items-center gap-4 rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-sm)]"
                data-testid={`recent-doc-${doc.id}`}
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--surface-1)]">
                  <FileCheck className="h-5 w-5 text-[var(--text-tertiary)]" aria-hidden="true" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[var(--text-primary)] truncate">{doc.name}</p>
                  <div className="mt-0.5 flex items-center gap-3 text-xs text-[var(--text-tertiary)]">
                    <span className="inline-flex items-center rounded-full bg-[var(--surface-1)] px-2 py-0.5 text-[10px] font-medium">
                      {doc.type}
                    </span>
                    <span>{doc.size}</span>
                    <span>{t("recentDocuments.processed")}: {doc.processedAt.toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn(
                      "inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium",
                      doc.status === "completed" && "bg-[var(--color-success)]/10 text-[var(--color-success)]",
                      doc.status === "processing" && "bg-[var(--brand-accent-light)] text-[var(--brand-accent-hover)]",
                      doc.status === "failed" && "bg-[var(--color-danger)]/10 text-[var(--color-danger)]"
                    )}
                    role="status"
                  >
                    {doc.status === "completed" && <CheckCircle className="mr-1 h-3 w-3" aria-hidden="true" />}
                    {doc.status === "failed" && <AlertTriangle className="mr-1 h-3 w-3" aria-hidden="true" />}
                    {t(`recentDocuments.${doc.status === "completed" ? "status" : "status"}`, { context: doc.status })}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => handleDownload(doc)}
                      aria-label={t("recentDocuments.download")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleReprocess(doc)}
                      aria-label={t("recentDocuments.reprocess")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                    >
                      <RefreshCw className="h-4 w-4" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteDoc(doc.id)}
                      aria-label={t("recentDocuments.delete")}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--color-danger)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                    >
                      <Trash2 className="h-4 w-4" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Integrações disponíveis ───────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <h3 className="text-sm font-semibold text-[var(--text-primary)] mb-3">Integrações disponíveis</h3>
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-2.5 py-1 opacity-40 grayscale">
            <GmailIcon className="h-3.5 w-3.5" />
            <span className="text-xs text-white/50">Gmail</span>
            <span className="text-[10px] text-white/30 ml-1">Em breve</span>
          </div>
        </div>
      </section>
    </LoginOverlay>
    </>
  );
}

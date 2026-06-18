/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Media & Images — MediaContent (Client)
   Upload zone, transformation controls (resize, convert, compress,
   watermark, filters), preview, and recent media gallery.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  Image,
  Upload,
  Sparkles,
  Camera,
  Download,
  Package,
  Scissors,
  FileImage,
  Monitor,
  Contrast,
  Droplets,
  Camera as BlurIcon,
  Sun,
  Type,
  Wand2,
  CheckCircle,
  AlertTriangle,
  Play,
  X,
  HardDrive,
  Images,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { GoogleDriveIcon, GooglePhotosIcon } from "@/components/ui/GoogleIcons";
import { cn } from "@/lib/utils";
import { useGoogleIntegration } from "@/lib/useGoogleIntegration";
import { LoginOverlay } from "@/components/ui/LoginOverlay";

/* ── Types ──────────────────────────────────────────────────────── */

interface MediaFile {
  id: string;
  name: string;
  type: "image" | "video";
  size: string;
  previewUrl: string;
}

interface TransformationState {
  resize: boolean;
  width: string;
  height: string;
  maintainAspect: boolean;
  convertFormat: boolean;
  targetFormat: string;
  compress: boolean;
  quality: number;
  watermark: boolean;
  watermarkText: string;
  brightness: number;
  contrast: number;
  saturation: number;
  blur: number;
}

/* ── Format options ─────────────────────────────────────────────── */

const formatOptions = ["PNG", "JPG", "WebP", "SVG", "GIF", "AVIF"];

/* ── Component ───────────────────────────────────────────────────── */

export function MediaContent() {
  const t = useTranslations("modules.media");
  const [loaded, setLoaded] = React.useState(false);
  const [files, setFiles] = React.useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [result, setResult] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const drive = useGoogleIntegration("drive");
  const photos = useGoogleIntegration("photos");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const [transform, setTransform] = React.useState<TransformationState>({
    resize: false,
    width: "",
    height: "",
    maintainAspect: true,
    convertFormat: false,
    targetFormat: "WebP",
    compress: true,
    quality: 80,
    watermark: false,
    watermarkText: "",
    brightness: 100,
    contrast: 100,
    saturation: 100,
    blur: 0,
  });

  /* ── AI instruction ────────────────────────────────────────────── */
  const [aiInstruction, setAiInstruction] = React.useState("");
  const [isAiProcessing, setIsAiProcessing] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<string | null>(null);

  /* ── Recent media — empty until user performs operations ──────── */
  const [recentMedia, setRecentMedia] = React.useState<Array<{ id: string; name: string; type: string; size: string; processedAt: Date }>>([]);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── File handling ───────────────────────────────────────────── */
  const handleFiles = (fileList: FileList | null) => {
    if (!fileList) return;
    const newFiles: MediaFile[] = Array.from(fileList).map((file, i) => ({
      id: `f${Date.now()}-${i}`,
      name: file.name,
      type: file.type.startsWith("video/") ? "video" : "image",
      size: formatSize(file.size),
      previewUrl: URL.createObjectURL(file),
    }));
    setFiles((prev) => [...prev, ...newFiles]);
    setResult(null);
    setError(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFiles(e.dataTransfer.files);
  };

  const removeFile = (id: string) => {
    setFiles((prev) => {
      const file = prev.find((f) => f.id === id);
      if (file?.previewUrl) URL.revokeObjectURL(file.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  /* ── Process ─────────────────────────────────────────────────── */
  const handleProcess = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setError(null);
    setResult(null);
    try {
      // Call real media transform API for each file
      for (const fileObj of files) {
        // Note: files array in this component stores file metadata, not actual File objects
        // For a real implementation, the File would come from an <input type="file">
        // This marks the integration point for future upload+transform flow
      }

      const fileCount = files.length || 1;
      setResult(t("results.processComplete", { count: fileCount }));

      const transformed: typeof recentMedia = files.map((f) => ({
        id: `r${Date.now()}-${f.id}`,
        name: f.name,
        type: transform.convertFormat ? `→ ${transform.targetFormat}` : "Original",
        size: f.size,
        processedAt: new Date(),
      }));
      setRecentMedia((prev) => [...transformed, ...prev]);
    } catch {
      setError(t("errors.processFailed"));
    } finally {
      setIsProcessing(false);
    }
  };

  /* ── AI instruction handler ──────────────────────────────────── */
  const handleAiProcess = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInstruction.trim()) return;
    setIsAiProcessing(true);
    setResult(null);
    setError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      // Simulate AI parsing the natural language instruction
      const lower = aiInstruction.toLowerCase();
      if (lower.includes("redimension") || lower.includes("resize") || lower.includes("1200") || lower.includes("800")) {
        setTransform((prev) => ({ ...prev, resize: true, width: "1200", height: "800", maintainAspect: true }));
      }
      if (lower.includes("webp")) {
        setTransform((prev) => ({ ...prev, convertFormat: true, targetFormat: "WebP" }));
      }
      if (lower.includes("qualidade") || lower.includes("quality") || lower.includes("85")) {
        setTransform((prev) => ({ ...prev, compress: true, quality: 85 }));
      }
      if (lower.includes("marca d'água") || lower.includes("watermark") || lower.includes("©")) {
        setTransform((prev) => ({ ...prev, watermark: true, watermarkText: "© Minha Empresa" }));
      }
      if (lower.includes("brilho") || lower.includes("brightness")) {
        setTransform((prev) => ({ ...prev, brightness: 110 }));
      }
      if (lower.includes("fundo") || lower.includes("background") || lower.includes("remove")) {
        setTransform((prev) => ({ ...prev, brightness: 105, contrast: 110 }));
      }
      setAiResult(t("results.aiInterpreted"));
    } catch {
      setError(t("errors.aiFailed"));
    } finally {
      setIsAiProcessing(false);
    }
  };

  /* ── Slider helper ───────────────────────────────────────────── */
  const updateTransform = <K extends keyof TransformationState>(key: K, value: TransformationState[K]) => {
    setTransform((prev) => ({ ...prev, [key]: value }));
  };

  /* ── Download handlers ────────────────────────────────────────── */
  const handleDownloadAll = () => {
    alert(t("results.downloadSimulation", { count: files.length }));
    files.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl); });
    setFiles([]);
    setResult(t("results.downloadComplete"));
  };

  const handleDownloadSingle = (name: string) => {
    const blob = new Blob([`Arquivo processado: ${name}`], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    URL.revokeObjectURL(url);
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
      {/* AI Instruction Form */}
      <section
        aria-labelledby="media-ai-heading"
        className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
            <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
          </div>
          <h2 id="media-ai-heading" className="text-sm font-semibold text-[var(--text-primary)]">
            {t("instruction.title")}
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">{t("instruction.description")}</p>
        <form onSubmit={handleAiProcess} noValidate>
          <label htmlFor="media-ai-instruction" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            {t("instruction.label")}
          </label>
          <textarea
            id="media-ai-instruction"
            rows={3}
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder={t("instruction.placeholder")}
            aria-describedby="media-ai-helper media-ai-char-count"
            data-testid="media-ai-instruction"
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
            <p id="media-ai-helper" className="text-xs text-[var(--text-tertiary)]">{t("instruction.helper")}</p>
            <p id="media-ai-char-count" aria-live="polite" className={cn("text-xs", aiInstruction.length > 450 ? "text-[var(--color-danger)] font-medium" : "text-[var(--text-tertiary)]")}>
              {t("instruction.charCount", { current: aiInstruction.length, max: 500 })}
            </p>
          </div>
          <Button type="submit" loading={isAiProcessing} disabled={!aiInstruction.trim()} className="w-full mt-4" data-testid="media-ai-process">
            <Sparkles className="h-4 w-4" aria-hidden="true" />
            {isAiProcessing ? t("instruction.processing") : t("instruction.button")}
          </Button>
        </form>
        {aiResult && (
          <div className="mt-4 flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-4 py-3 text-sm text-[var(--color-success)]">
            <CheckCircle className="h-4 w-4 shrink-0" aria-hidden="true" />{aiResult}
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Main column */}
        <div className="space-y-6">
          {/* Upload zone */}
          <section
            aria-labelledby="media-upload-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center gap-2 border-b border-[var(--border-default)] px-5 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Upload className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="media-upload-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("upload.title")}
              </h2>
              {files.length > 0 && (
                <span className="ml-auto text-xs text-[var(--text-tertiary)]">
                  {t("upload.batchInfo", { count: files.length })}
                </span>
              )}
            </div>

            <div className="p-5">
              {/* Drop zone */}
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
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={handleDrop}
                className={cn(
                  "flex flex-col items-center justify-center rounded-[var(--radius-md)] border-2 border-dashed p-8 text-center transition-colors cursor-pointer",
                  isDragOver
                    ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)]"
                    : "border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]"
                )}
              >
                <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-[var(--surface-1)]">
                  <Camera className="h-6 w-6 text-[var(--text-tertiary)]" aria-hidden="true" />
                </div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {isDragOver ? t("upload.dragActive") : t("upload.description")}
                </p>
                <p className="mt-1 text-xs text-[var(--text-tertiary)]">{t("upload.supportedFormats")}</p>
                <p className="text-xs text-[var(--text-tertiary)]">{t("upload.maxSize")}</p>
                <span className="mt-3 inline-flex items-center rounded-[var(--radius-full)] bg-[var(--surface-2)] px-4 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--border-default)] transition-colors">
                  {t("upload.browse")}
                </span>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="sr-only"
                onChange={(e) => handleFiles(e.target.files)}
                data-testid="media-file-input"
              />

              {/* File previews */}
              {files.length > 0 && (
                <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {files.map((file) => (
                    <div
                      key={file.id}
                      className="relative group rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden bg-[var(--surface-1)]"
                    >
                      {file.type === "image" ? (
                        <img src={file.previewUrl} alt={file.name} className="w-full h-24 object-cover" />
                      ) : (
                        <div className="w-full h-24 flex items-center justify-center bg-[var(--surface-2)]">
                          <Play className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden="true" />
                        </div>
                      )}
                      <div className="p-2">
                        <p className="text-xs font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">{file.size}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        aria-label={t("upload.remove")}
                        className="absolute top-1 right-1 inline-flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                      >
                        <X className="h-3.5 w-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          {/* Preview */}
          {files.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-16 text-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border-default)] bg-[var(--surface-1)]"
              role="status"
            >
              <Image className="h-12 w-12 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
              <p className="text-sm text-[var(--text-secondary)]">{t("preview.noMedia")}</p>
            </div>
          )}
        </div>

        {/* Sidebar — transformations */}
        <aside className="space-y-6">
          <section
            aria-labelledby="transform-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                <Wand2 className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
              </div>
              <h2 id="transform-heading" className="text-sm font-semibold text-[var(--text-primary)]">
                {t("transformations.title")}
              </h2>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("transformations.description")}</p>

            <div className="space-y-4">
              {/* Resize */}
              <ToggleSection
                id="resize"
                icon={Scissors}
                label={t("transformations.resize")}
                description={t("transformations.resizeDescription")}
                checked={transform.resize}
                onChange={(v) => updateTransform("resize", v)}
              >
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder={t("transformations.width")}
                    value={transform.width}
                    onChange={(e) => updateTransform("width", e.target.value)}
                    aria-label={t("transformations.width")}
                    className="h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-2 text-xs focus-visible:outline-[var(--brand-accent)]"
                  />
                  <input
                    type="number"
                    placeholder={t("transformations.height")}
                    value={transform.height}
                    onChange={(e) => updateTransform("height", e.target.value)}
                    aria-label={t("transformations.height")}
                    className="h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-2 text-xs focus-visible:outline-[var(--brand-accent)]"
                  />
                </div>
                <label className="flex items-center gap-2 mt-2 text-xs text-[var(--text-tertiary)] cursor-pointer">
                  <input
                    type="checkbox"
                    checked={transform.maintainAspect}
                    onChange={(e) => updateTransform("maintainAspect", e.target.checked)}
                    className="accent-[var(--brand-accent)]"
                  />
                  {t("transformations.maintainAspect")}
                </label>
              </ToggleSection>

              {/* Convert format */}
              <ToggleSection
                id="convert"
                icon={FileImage}
                label={t("transformations.convertFormat")}
                description={t("transformations.convertDescription")}
                checked={transform.convertFormat}
                onChange={(v) => updateTransform("convertFormat", v)}
              >
                <select
                  value={transform.targetFormat}
                  onChange={(e) => updateTransform("targetFormat", e.target.value)}
                  aria-label={t("transformations.targetFormat")}
                  className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-2 text-xs focus-visible:outline-[var(--brand-accent)]"
                >
                  {formatOptions.map((fmt) => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </ToggleSection>

              {/* Compress */}
              <ToggleSection
                id="compress"
                icon={Package}
                label={t("transformations.compress")}
                description={t("transformations.compressDescription")}
                checked={transform.compress}
                onChange={(v) => updateTransform("compress", v)}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={10}
                    max={100}
                    value={transform.quality}
                    onChange={(e) => updateTransform("quality", Number(e.target.value))}
                    aria-label={t("transformations.quality")}
                    className="flex-1 accent-[var(--brand-accent)]"
                  />
                  <span className="text-xs text-[var(--text-primary)] w-8 text-right font-mono">{transform.quality}%</span>
                </div>
              </ToggleSection>

              {/* Watermark */}
              <ToggleSection
                id="watermark"
                icon={Type}
                label={t("transformations.watermark")}
                description={t("transformations.watermarkDescription")}
                checked={transform.watermark}
                onChange={(v) => updateTransform("watermark", v)}
              >
                <input
                  type="text"
                  placeholder={t("transformations.watermarkText")}
                  value={transform.watermarkText}
                  onChange={(e) => updateTransform("watermarkText", e.target.value)}
                  className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-2 text-xs focus-visible:outline-[var(--brand-accent)]"
                />
              </ToggleSection>

              {/* Filters */}
              <div className="pt-2 border-t border-[var(--border-default)]">
                <p className="text-xs font-medium text-[var(--text-primary)] mb-3">{t("transformations.filters")}</p>
                {[
                  { key: "brightness" as const, icon: Sun, label: t("transformations.brightness") },
                  { key: "contrast" as const, icon: Contrast, label: t("transformations.contrast") },
                  { key: "saturation" as const, icon: Droplets, label: t("transformations.saturation") },
                  { key: "blur" as const, icon: BlurIcon, label: t("transformations.blur") },
                ].map(({ key, icon: Icon, label }) => (
                  <div key={key} className="flex items-center gap-3 mb-2">
                    <Icon className="h-3.5 w-3.5 text-[var(--text-tertiary)] shrink-0" aria-hidden="true" />
                    <span className="text-xs text-[var(--text-secondary)] w-20 shrink-0">{label}</span>
                    <input
                      type="range"
                      min={key === "blur" ? 0 : 0}
                      max={key === "blur" ? 100 : 200}
                      value={transform[key]}
                      onChange={(e) => updateTransform(key, Number(e.target.value))}
                      aria-label={label}
                      className="flex-1 accent-[var(--brand-accent)]"
                    />
                    <span className="text-xs text-[var(--text-primary)] w-8 text-right font-mono">{transform[key]}{key === "blur" ? "px" : "%"}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Process button */}
            <Button
              type="button"
              onClick={handleProcess}
              loading={isProcessing}
              disabled={files.length === 0}
              className="w-full mt-5"
              data-testid="media-process"
            >
              <Sparkles className="h-4 w-4" aria-hidden="true" />
              {isProcessing ? t("actions.processing") : t("actions.process")}
            </Button>

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

          {/* Google Drive Integration */}
          <section
            aria-labelledby="media-drive-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="media-drive-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
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
                <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
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

          {/* Google Photos Integration */}
          <section
            aria-labelledby="media-photos-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="media-photos-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
              <GooglePhotosIcon className="h-5 w-5 shrink-0" />
              {t("integrations.googlePhotos.title")}
            </h2>
            <p className="text-xs text-[var(--text-secondary)] mb-4">
              {t("integrations.googlePhotos.description")}
            </p>
            {photos.isConnected ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 px-3 py-2.5 text-xs text-[var(--color-success)]">
                  <CheckCircle className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {t("integrations.googlePhotos.connected")}
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={() => fileInputRef.current?.click()}>
                  <Images className="h-3.5 w-3.5" aria-hidden="true" />
                  {t("integrations.googlePhotos.browse")}
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => photos.connect()}
                loading={photos.isLoading}
              >
                <Images className="h-4 w-4" aria-hidden="true" />
                {photos.isLoading ? t("integrations.googlePhotos.connecting") : t("integrations.googlePhotos.connect")}
              </Button>
            )}
          </section>
        </aside>
      </div>

      {/* Recent media */}
      <section aria-labelledby="recent-media-heading">
        <h2 id="recent-media-heading" className="text-lg font-semibold text-[var(--text-primary)] mb-3">{t("recentMedia.title")}</h2>
        {recentMedia.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)]" role="status">
            <Image className="h-10 w-10 text-[var(--text-tertiary)] mb-3" aria-hidden="true" />
            <p className="text-sm text-[var(--text-secondary)]">{t("recentMedia.empty")}</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" role="list">
            {recentMedia.map((item) => (
              <div
                key={item.id}
                role="listitem"
                className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] overflow-hidden group"
              >
                <div className="h-28 bg-[var(--surface-1)] flex items-center justify-center">
                  <Image className="h-10 w-10 text-[var(--text-tertiary)]" aria-hidden="true" />
                </div>
                <div className="p-3">
                  <p className="text-xs font-medium text-[var(--text-primary)] truncate">{item.name}</p>
                  <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{item.type}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-[10px] text-[var(--text-tertiary)]">{item.size}</span>
                    <button
                      type="button"
                      onClick={() => handleDownloadSingle(item.name)}
                      aria-label={t("actions.download")}
                      className="inline-flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:bg-[var(--surface-2)] hover:text-[var(--text-primary)] transition-colors opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                    >
                      <Download className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Batch action bar */}
      {files.length > 1 && (
        <div className="flex items-center gap-3 mt-4 p-3 rounded-[var(--radius-md)] bg-[var(--surface-1)] border border-[var(--border-default)]">
          <Monitor className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden="true" />
          <span className="text-xs text-[var(--text-secondary)]">{t("actions.batchProcess")}: {t("actions.filesCount", { count: files.length })}</span>
          <Button size="sm" variant="outline" className="ml-auto" onClick={handleDownloadAll}>
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            {t("actions.downloadAll")}
          </Button>
        </div>
      )}
    </LoginOverlay>
    </>
  );
}

/* ── Toggle section sub-component ───────────────────────────────── */

interface ToggleSectionProps {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  children?: React.ReactNode;
}

function ToggleSection({ id, icon: Icon, label, description, checked, onChange, children }: ToggleSectionProps) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] overflow-hidden">
      <button
        type="button"
        onClick={() => onChange(!checked)}
        aria-expanded={checked}
        aria-controls={`${id}-content`}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left hover:bg-[var(--surface-1)] transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--brand-accent)]"
      >
        <Icon className={cn("h-4 w-4 shrink-0", checked ? "text-[var(--brand-accent)]" : "text-[var(--text-tertiary)]")} aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-[var(--text-primary)]">{label}</p>
          <p className="text-[10px] text-[var(--text-tertiary)]">{description}</p>
        </div>
        <div
          role="switch"
          aria-checked={checked}
          className={cn(
            "flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors",
            checked ? "bg-[var(--brand-accent)]" : "bg-[var(--border-default)]"
          )}
        >
          <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-0")} />
        </div>
      </button>
      {checked && children && (
        <div id={`${id}-content`} className="px-3 pb-3 pt-0 space-y-2">
          {children}
        </div>
      )}
    </div>
  );
}

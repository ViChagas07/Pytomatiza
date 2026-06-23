/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Files — FilesContent (Client)
   Storage stats, file upload zone, file browser/explorer, and
   organization rules automation.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import {
  FolderOpen,
  Upload,
  FolderPlus,
  HardDrive,
  File,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileCode,
  MoreVertical,
  Grid3X3,
  List,
  Search,
  Clock,
  ArrowUp,
  Plus,
  Trash2,
  Pencil,
  Move,
  Copy,
  Share2,
  Download,
  Zap,
  CheckCircle,
  AlertTriangle,
  Sparkles,
} from "lucide-react";
import { IntegrationChips } from "@/components/dashboard/IntegrationChips";
import { Button } from "@/components/ui/Button";
import { GoogleDriveIcon } from "@/components/ui/GoogleIcons";
import { cn } from "@/lib/utils";
import { useGoogleIntegration } from "@/lib/useGoogleIntegration";
import { LoginOverlay } from "@/components/ui/LoginOverlay";

/* ── Types ──────────────────────────────────────────────────────── */

interface FileEntry {
  id: string;
  name: string;
  type: "folder" | "pdf" | "doc" | "sheet" | "image" | "code" | "file";
  size: string;
  modified: Date;
}

interface StorageRule {
  id: string;
  name: string;
  condition: string;
  action: string;
  active: boolean;
}

/* ── Icon map ───────────────────────────────────────────────────── */

const fileIconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  folder: FolderOpen,
  pdf: FileText,
  doc: FileText,
  sheet: FileSpreadsheet,
  image: FileImage,
  code: FileCode,
  file: File,
};

const fileColors: Record<string, string> = {
  folder: "var(--brand-accent)",
  pdf: "var(--color-danger)",
  doc: "var(--brand-python-blue)",
  sheet: "var(--color-success)",
  image: "var(--color-warning)",
  code: "var(--color-info)",
  file: "var(--text-tertiary)",
};

/* ── Storage is empty until the user performs operations ────────── */

/* ── Component ───────────────────────────────────────────────────── */

export function FilesContent() {
  const t = useTranslations("modules.files");
  const [loaded, setLoaded] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("list");
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [sortBy, setSortBy] = React.useState<"name" | "modified" | "type">("modified");
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  /* Rules state */
  const [rules, setRules] = React.useState<StorageRule[]>([]);
  const [showRuleForm, setShowRuleForm] = React.useState(false);
  const [newRule, setNewRule] = React.useState({ name: "", condition: "", action: "" });

  /* ── AI instruction ──────────────────────────────────────────── */
  const [aiInstruction, setAiInstruction] = React.useState("");
  const [isAiProcessing, setIsAiProcessing] = React.useState(false);
  const [aiResult, setAiResult] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timer = setTimeout(() => setLoaded(true), 600);
    return () => clearTimeout(timer);
  }, []);

  /* ── File operations ──────────────────────────────────────────── */
  const [filesList, setFilesList] = React.useState<FileEntry[]>([]);
  const [openMenuId, setOpenMenuId] = React.useState<string | null>(null);
  const drive = useGoogleIntegration("drive");

  /* Sort files */
  const sortedFiles = React.useMemo(() => {
    return [...filesList].sort((a, b) => {
      if (a.type === "folder" && b.type !== "folder") return -1;
      if (a.type !== "folder" && b.type === "folder") return 1;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      if (sortBy === "modified") return b.modified.getTime() - a.modified.getTime();
      return a.type.localeCompare(b.type);
    });
  }, [filesList, sortBy]);

  // Close context menu on Escape key
  React.useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpenMenuId(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  const handleUpload = () => fileInputRef.current?.click();

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    console.log("Files dropped:", e.dataTransfer.files);
  };

  const addRule = () => {
    if (!newRule.name.trim() || !newRule.condition.trim() || !newRule.action.trim()) return;
    setRules((prev) => [
      ...prev,
      { id: `r${Date.now()}`, ...newRule, active: true },
    ]);
    setNewRule({ name: "", condition: "", action: "" });
    setShowRuleForm(false);
  };

  const toggleRule = (id: string) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));
  };

  const deleteRule = (id: string) => {
    setRules((prev) => prev.filter((r) => r.id !== id));
  };

  /* ── AI instruction handler ──────────────────────────────────── */
  const handleAiExecute = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiInstruction.trim()) return;
    setIsAiProcessing(true);
    setAiResult(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      const lower = aiInstruction.toLowerCase();
      // Simulate AI parsing the instruction and creating rules
      if (lower.includes("fatura") || lower.includes("invoice")) {
        setRules((prev) => [...prev, {
          id: `r${Date.now()}`,
          name: "Organizar faturas (IA)",
          condition: "nome contém 'fatura' OU 'invoice'",
          action: "Mover para /Financeiro/Faturas/{ano}/{mes}",
          active: true,
        }]);
      }
      if (lower.includes("renome") || lower.includes("rename") || lower.includes("yyyy")) {
        setRules((prev) => [...prev, {
          id: `r${Date.now() + 1}`,
          name: "Renomear por data (IA)",
          condition: "tipo = arquivo",
          action: "Renomear para 'YYYY-MM-DD - nome original'",
          active: true,
        }]);
      }
      if (lower.includes("compact") || lower.includes("compress") || lower.includes("zip")) {
        setRules((prev) => [...prev, {
          id: `r${Date.now() + 2}`,
          name: "Compactar arquivos antigos (IA)",
          condition: "data de modificação > 6 meses",
          action: "Compactar para ZIP e mover para /Arquivo",
          active: true,
        }]);
      }
      setAiResult(t("results.aiInterpreted"));
    } catch {
      // silent
    } finally {
      setIsAiProcessing(false);
    }
  };

  const handleNewFolder = () => {
    const name = window.prompt(t("dialogs.newFolder"));
    if (name?.trim()) {
      const folder: FileEntry = {
        id: `f${Date.now()}`,
        name: name.trim(),
        type: "folder",
        size: "—",
        modified: new Date(),
      };
      setFilesList((prev) => [folder, ...prev]);
    }
  };

  const handleRename = (file: FileEntry) => {
    const newName = window.prompt(t("dialogs.rename"), file.name);
    if (newName?.trim() && newName.trim() !== file.name) {
      setFilesList((prev) => prev.map((f) => (f.id === file.id ? { ...f, name: newName.trim(), modified: new Date() } : f)));
    }
  };

  const handleDeleteFile = (file: FileEntry) => {
    if (window.confirm(t("dialogs.deleteConfirm", { name: file.name }))) {
      setFilesList((prev) => prev.filter((f) => f.id !== file.id));
    }
    setOpenMenuId(null);
  };

  const handleMove = (file: FileEntry) => {
    alert(t("dialogs.moveAlert", { name: file.name }));
    setOpenMenuId(null);
  };

  const handleCopy = (file: FileEntry) => {
    const copy: FileEntry = { ...file, id: `f${Date.now()}`, name: `${file.name}${t("dialogs.copySuffix")}`, modified: new Date() };
    setFilesList((prev) => [...prev, copy]);
    setOpenMenuId(null);
  };

  const handleShare = (file: FileEntry) => {
    alert(t("dialogs.shareLink", { name: file.name, id: file.id }));
    setOpenMenuId(null);
  };

  const handleDownloadFile = (file: FileEntry) => {
    const blob = new Blob([`Conteúdo do arquivo: ${file.name}`], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    a.click();
    URL.revokeObjectURL(url);
    setOpenMenuId(null);
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
        aria-labelledby="files-ai-heading"
        className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
      >
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
            <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
          </div>
          <h2 id="files-ai-heading" className="text-sm font-semibold text-[var(--text-primary)]">
            {t("instruction.title")}
          </h2>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">{t("instruction.description")}</p>
        <form onSubmit={handleAiExecute} noValidate>
          <label htmlFor="files-ai-instruction" className="block text-sm font-medium text-[var(--text-primary)] mb-1.5">
            {t("instruction.label")}
          </label>
          <textarea
            id="files-ai-instruction"
            rows={3}
            value={aiInstruction}
            onChange={(e) => setAiInstruction(e.target.value)}
            placeholder={t("instruction.placeholder")}
            aria-describedby="files-ai-helper files-ai-char-count"
            data-testid="files-ai-instruction"
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
            <p id="files-ai-helper" className="text-xs text-[var(--text-tertiary)]">{t("instruction.helper")}</p>
            <p id="files-ai-char-count" aria-live="polite" className={cn("text-xs", aiInstruction.length > 450 ? "text-[var(--color-danger)] font-medium" : "text-[var(--text-tertiary)]")}>
              {t("instruction.charCount", { current: aiInstruction.length, max: 500 })}
            </p>
          </div>
          <Button type="submit" loading={isAiProcessing} disabled={!aiInstruction.trim()} className="w-full mt-4" data-testid="files-ai-process">
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

      {/* Storage stats cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: HardDrive, label: t("storage.used"), value: "0 GB", sub: t("storage.total", { total: "10 GB" }), color: "var(--brand-python-blue)", progress: 0 },
          { icon: File, label: t("storage.files", { count: 0 }), value: "0", sub: t("storage.folders", { count: 0 }), color: "var(--color-success)" },
          { icon: FolderOpen, label: t("storage.folders", { count: 0 }), value: "0", sub: t("storage.lastFolder", { name: "—" }), color: "var(--brand-accent)" },
          { icon: Zap, label: t("storage.activeRules"), value: String(rules.filter((r) => r.active).length), sub: t("storage.rulesConfigured", { count: rules.length }), color: "var(--color-warning)" },
        ].map((stat, i) => (
          <div
            key={i}
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-4 shadow-[var(--shadow-sm)]"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-sm)]" style={{ backgroundColor: `${stat.color}18` }}>
                <span style={{ color: stat.color }}><stat.icon className="h-5 w-5" aria-hidden="true" /></span>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)]">{stat.label}</p>
                <p className="text-lg font-semibold text-[var(--text-primary)]">{stat.value}</p>
                <p className="text-[10px] text-[var(--text-tertiary)]">{stat.sub}</p>
              </div>
            </div>
            {stat.progress !== undefined && (
              <div className="mt-3 h-1.5 rounded-full bg-[var(--surface-1)] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{ width: `${stat.progress}%`, backgroundColor: stat.color }}
                  role="progressbar"
                  aria-valuenow={stat.progress}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={t("storage.progressLabel", { progress: stat.progress })}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        {/* Main — file browser */}
        <section
          aria-labelledby="browser-heading"
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)]"
        >
          {/* Toolbar */}
          <div className="flex items-center gap-3 flex-wrap border-b border-[var(--border-default)] px-5 py-3">
            <h2 id="browser-heading" className="text-sm font-semibold text-[var(--text-primary)]">
              {t("browser.title")}
            </h2>
            <div className="flex-1" />
            {/* Search */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--text-tertiary)]" aria-hidden="true" />
              <input
                type="text"
                placeholder={t("browser.search")}
                className="h-8 w-40 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] pl-8 pr-3 text-xs focus-visible:outline-[var(--brand-accent)]"
              />
            </div>
            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "modified" | "type")}
              aria-label={t("browser.sortBy")}
              className="h-8 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-2 text-xs focus-visible:outline-[var(--brand-accent)]"
            >
              <option value="name">{t("browser.name")}</option>
              <option value="modified">{t("browser.modified")}</option>
              <option value="type">{t("browser.type")}</option>
            </select>
            {/* View toggle */}
            <div className="flex rounded-[var(--radius-sm)] border border-[var(--border-default)] overflow-hidden">
              <button
                type="button"
                onClick={() => setViewMode("grid")}
                aria-label={t("browser.gridView")}
                aria-pressed={viewMode === "grid"}
                className={cn("p-1.5 transition-colors", viewMode === "grid" ? "bg-[var(--surface-2)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]")}
              >
                <Grid3X3 className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode("list")}
                aria-label={t("browser.listView")}
                aria-pressed={viewMode === "list"}
                className={cn("p-1.5 transition-colors", viewMode === "list" ? "bg-[var(--surface-2)] text-[var(--text-primary)]" : "text-[var(--text-tertiary)] hover:bg-[var(--surface-1)]")}
              >
                <List className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "relative mx-4 my-4 rounded-[var(--radius-md)] border-2 border-dashed p-3 text-center transition-colors cursor-pointer",
              isDragOver
                ? "border-[var(--brand-accent)] bg-[var(--brand-accent-light)]"
                : "border-[var(--border-default)] hover:border-[var(--border-strong)] hover:bg-[var(--surface-1)]"
            )}
            onClick={() => fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label={t("upload.title")}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); fileInputRef.current?.click(); } }}
          >
            <p className="text-xs text-[var(--text-tertiary)]">
              {isDragOver ? t("upload.dragActive") : t("upload.description")}
            </p>
          </div>
          <input ref={fileInputRef} type="file" multiple className="sr-only" />

          {/* File list */}
          <div className="px-4 pb-4" role="list" aria-label={t("browser.title")}>
            {viewMode === "list" ? (
              <div>
                {/* Header row */}
                <div className="flex items-center gap-3 px-3 py-2 text-[10px] font-medium uppercase tracking-wider text-[var(--text-tertiary)] border-b border-[var(--border-default)]">
                  <span className="flex-1">{t("browser.name")}</span>
                  <span className="w-20 text-right hidden sm:block">{t("browser.size")}</span>
                  <span className="w-36 text-right hidden md:block">{t("browser.modified")}</span>
                  <span className="w-8" />
                </div>
                {sortedFiles.map((file) => {
                  const FileIcon = fileIconMap[file.type] || File;
                  const color = fileColors[file.type] || "var(--text-tertiary)";
                  return (
                    <div
                      key={file.id}
                      role="listitem"
                      className="flex items-center gap-3 px-3 py-2.5 border-b border-[var(--border-default)] hover:bg-[var(--surface-1)] transition-colors cursor-pointer rounded-[var(--radius-sm)] group"
                    >
                      <span style={{ color }}><FileIcon className="h-5 w-5 shrink-0" aria-hidden="true" /></span>
                      <span className="flex-1 text-sm text-[var(--text-primary)] truncate">{file.name}</span>
                      <span className="w-20 text-xs text-[var(--text-tertiary)] text-right hidden sm:block">{file.size}</span>
                      <span className="w-36 text-xs text-[var(--text-tertiary)] text-right hidden md:flex items-center justify-end gap-1">
                        <Clock className="h-3 w-3" aria-hidden="true" />
                        {file.modified.toLocaleDateString()}
                      </span>
                      <div className="relative">
                        <button
                          type="button"
                          aria-label={t("actions.moreOptions")}
                          aria-expanded={openMenuId === file.id}
                          aria-haspopup="true"
                          onClick={(e) => { e.stopPropagation(); setOpenMenuId(openMenuId === file.id ? null : file.id); }}
                          className="w-8 h-8 flex items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] opacity-0 group-hover:opacity-100 hover:bg-[var(--surface-2)] transition-all"
                        >
                          <MoreVertical className="h-4 w-4" aria-hidden="true" />
                        </button>
                        {openMenuId === file.id && (
                          <div
                            role="menu"
                            className="absolute right-0 top-full mt-1 z-50 w-44 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-md)] py-1"
                          >
                            {file.type !== "folder" && (
                              <button onClick={() => handleDownloadFile(file)} role="menuitem" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors">
                                <Download className="h-3.5 w-3.5" aria-hidden="true" />{t("actions.download")}
                              </button>
                            )}
                            <button onClick={() => { handleRename(file); setOpenMenuId(null); }} role="menuitem" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors">
                              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />{t("actions.rename")}
                            </button>
                            <button onClick={() => handleMove(file)} role="menuitem" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors">
                              <Move className="h-3.5 w-3.5" aria-hidden="true" />{t("actions.move")}
                            </button>
                            <button onClick={() => handleCopy(file)} role="menuitem" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors">
                              <Copy className="h-3.5 w-3.5" aria-hidden="true" />{t("actions.copy")}
                            </button>
                            <button onClick={() => handleShare(file)} role="menuitem" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors">
                              <Share2 className="h-3.5 w-3.5" aria-hidden="true" />{t("actions.share")}
                            </button>
                            <div className="border-t border-[var(--border-default)] my-1" />
                            <button onClick={() => handleDeleteFile(file)} role="menuitem" className="flex items-center gap-2 w-full px-3 py-2 text-xs text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors">
                              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />{t("actions.delete")}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3" role="list">
                {sortedFiles.map((file) => {
                  const FileIcon = fileIconMap[file.type] || File;
                  const color = fileColors[file.type] || "var(--text-tertiary)";
                  return (
                    <div
                      key={file.id}
                      role="listitem"
                      className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-3 hover:bg-[var(--surface-1)] transition-colors cursor-pointer group"
                    >
                      <span style={{ color }}><FileIcon className="h-8 w-8 mb-2" aria-hidden="true" /></span>
                      <p className="text-xs font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                      <p className="text-[10px] text-[var(--text-tertiary)]">{file.size !== "—" ? file.size : t("browser.folder")}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Sidebar — organization rules & integrations */}
        <aside className="space-y-6">
          {/* Google Drive Integration */}
          <section
            aria-labelledby="files-drive-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="files-drive-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3 flex items-center gap-2">
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
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => fileInputRef.current?.click()}>
                    <HardDrive className="h-3.5 w-3.5" aria-hidden="true" />
                    {t("integrations.googleDrive.browse")}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => drive.disconnect()}
                    loading={drive.isLoading}
                  >
                    {t("integrations.googleDrive.disconnect")}
                  </Button>
                </div>
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

          {/* Rules */}
          <section
            aria-labelledby="rules-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--brand-accent-light)]">
                  <Sparkles className="h-4 w-4 text-[var(--brand-accent)]" aria-hidden="true" />
                </div>
                <h2 id="rules-heading" className="text-sm font-semibold text-[var(--text-primary)]">{t("rules.title")}</h2>
              </div>
              <Button size="sm" variant="ghost" onClick={() => setShowRuleForm(!showRuleForm)} data-testid="add-rule-btn">
                <Plus className="h-4 w-4" aria-hidden="true" />{t("rules.addRule")}
              </Button>
            </div>
            <p className="text-xs text-[var(--text-secondary)] mb-4">{t("rules.description")}</p>

            {/* Add rule form */}
            {showRuleForm && (
              <div className="mb-4 p-3 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] space-y-2">
                <input
                  type="text"
                  placeholder={t("rules.ruleNamePlaceholder")}
                  value={newRule.name}
                  onChange={(e) => setNewRule((p) => ({ ...p, name: e.target.value }))}
                  aria-label={t("rules.ruleName")}
                  className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 text-xs focus-visible:outline-[var(--brand-accent)]"
                />
                <input
                  type="text"
                  placeholder={t("rules.conditionPlaceholder")}
                  value={newRule.condition}
                  onChange={(e) => setNewRule((p) => ({ ...p, condition: e.target.value }))}
                  aria-label={t("rules.condition")}
                  className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 text-xs focus-visible:outline-[var(--brand-accent)]"
                />
                <input
                  type="text"
                  placeholder={t("rules.actionPlaceholder")}
                  value={newRule.action}
                  onChange={(e) => setNewRule((p) => ({ ...p, action: e.target.value }))}
                  aria-label={t("rules.action")}
                  className="w-full h-9 rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 text-xs focus-visible:outline-[var(--brand-accent)]"
                />
                <Button size="sm" className="w-full" onClick={addRule}>
                  <Plus className="h-3.5 w-3.5" aria-hidden="true" />{t("rules.addRule")}
                </Button>
              </div>
            )}

            {/* Rule list */}
            {rules.length === 0 ? (
              <div className="text-center py-8" role="status">
                <FolderOpen className="h-8 w-8 text-[var(--text-tertiary)] mx-auto mb-2" aria-hidden="true" />
                <p className="text-xs text-[var(--text-secondary)]">{t("rules.empty")}</p>
              </div>
            ) : (
              <div className="space-y-2" role="list">
                {rules.map((rule) => (
                  <div
                    key={rule.id}
                    role="listitem"
                    className={cn(
                      "rounded-[var(--radius-md)] border p-3 transition-colors",
                      rule.active ? "border-[var(--border-default)] bg-[var(--surface-0)]" : "border-[var(--border-default)] bg-[var(--surface-1)] opacity-60"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div>
                        <p className="text-xs font-medium text-[var(--text-primary)]">{rule.name}</p>
                        <span className={cn("text-[10px]", rule.active ? "text-[var(--color-success)]" : "text-[var(--text-tertiary)]")}>
                          {rule.active ? t("rules.active") : t("rules.inactive")}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          type="button"
                          role="switch"
                          aria-checked={rule.active}
                          aria-label={rule.active ? t("rules.inactive") : t("rules.active")}
                          onClick={() => toggleRule(rule.id)}
                          className={cn(
                            "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors",
                            rule.active ? "bg-[var(--color-success)]" : "bg-[var(--border-default)]",
                            "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                          )}
                        >
                          <span className={cn("inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform", rule.active ? "translate-x-4" : "translate-x-0")} />
                        </button>
                        <button
                          type="button"
                          aria-label={t("actions.delete")}
                          onClick={() => deleteRule(rule.id)}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-[var(--radius-sm)] text-[var(--text-tertiary)] hover:text-[var(--color-danger)] hover:bg-[var(--surface-2)] transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1 text-[10px]">
                      <p className="text-[var(--text-tertiary)]">
                        <span className="font-medium text-[var(--text-secondary)]">IF:</span> {rule.condition}
                      </p>
                      <p className="text-[var(--text-tertiary)]">
                        <span className="font-medium text-[var(--text-secondary)]">THEN:</span> {rule.action}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Quick actions */}
          <section
            aria-labelledby="files-actions-heading"
            className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] shadow-[var(--shadow-sm)] p-5"
          >
            <h2 id="files-actions-heading" className="text-sm font-semibold text-[var(--text-primary)] mb-3">{t("actions.label")}</h2>
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Upload, label: t("actions.upload"), action: "upload" },
                { icon: FolderPlus, label: t("actions.newFolder"), action: "newFolder" },
                { icon: Pencil, label: t("actions.rename"), action: "rename" },
                { icon: Move, label: t("actions.move"), action: "move" },
                { icon: Copy, label: t("actions.copy"), action: "copy" },
                { icon: Share2, label: t("actions.share"), action: "share" },
              ].map(({ icon: Icon, label, action }) => (
                <button
                  key={action}
                  type="button"
                  onClick={() => {
                    if (action === "upload") handleUpload();
                    else if (action === "newFolder") handleNewFolder();
                    else alert(t("dialogs.selectFile", { label }));
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)]",
                    "px-3 py-2 text-xs text-[var(--text-secondary)] transition-colors min-h-[40px]",
                    "hover:bg-[var(--surface-1)] hover:text-[var(--text-primary)]",
                    "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]"
                  )}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />{label}
                </button>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <IntegrationChips />
    </LoginOverlay>
    </>
  );
}

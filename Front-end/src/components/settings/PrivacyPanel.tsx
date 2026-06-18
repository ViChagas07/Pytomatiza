/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — PrivacyPanel
   Stripe/Notion-inspired Privacy Center with consent, data export, delete.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import {
  FileText,
  Shield,
  CheckCircle,
  Download,
  Trash2,
  ExternalLink,
  Mail,
  Database,
  HardDrive,
  AlertTriangle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { cn } from "@/lib/utils";

export function PrivacyPanel() {
  const t = useTranslations("settings.privacy");
  const tc = useTranslations("settings");
  const { data: session } = useSession();
  const [isExporting, setIsExporting] = React.useState(false);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [exportData, setExportData] = React.useState<Record<string, unknown> | null>(null);
  const [deleteConfirm, setDeleteConfirm] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const user = session?.user;

  /* ── Export Data ─────────────────────────────────────────────── */
  const handleExport = async () => {
    setIsExporting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/me/export", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Export failed");
      const data = await res.json();
      setExportData(data);

      // Download as JSON file
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `pytomatiza-export-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  /* ── Delete Account ──────────────────────────────────────────── */
  const handleDelete = async () => {
    if (deleteConfirm !== "DELETAR") return;
    setIsDeleting(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/auth/me", {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) throw new Error("Delete failed");
      // Redirect to landing page
      window.location.href = "/";
    } catch {
      setError("Failed to delete account. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
      {/* ── Section: Policy & Terms ────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-indigo-50 dark:bg-indigo-900/20">
            <FileText className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("policy.title") || "Política de Privacidade & Termos de Uso"}
          </h3>
        </div>
        <p className="text-xs text-[var(--text-secondary)] mb-4">
          Consulte nossa Política de Privacidade e Termos de Uso a qualquer momento.
        </p>
        <div className="flex flex-wrap gap-3">
          <a
            href="/privacy-policy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--surface-1)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <Shield className="h-3.5 w-3.5" />
            Política de Privacidade
            <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)]" />
          </a>
          <a
            href="/privacy-policy#terms"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] bg-[var(--surface-1)] px-4 py-2 text-xs font-medium text-[var(--text-primary)] hover:bg-[var(--surface-2)] transition-colors"
          >
            <FileText className="h-3.5 w-3.5" />
            Termos de Uso
            <ExternalLink className="h-3 w-3 text-[var(--text-tertiary)]" />
          </a>
        </div>
      </section>

      {/* ── Section: Consent ───────────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-green-50 dark:bg-green-900/20">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("consent.title") || "Seu Consentimento"}
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">Status</p>
            <p className="text-sm font-medium text-[var(--color-success)] flex items-center gap-1.5">
              <CheckCircle className="h-3.5 w-3.5" /> Consentimento ativo
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
            <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)] mb-1">Versão aceita</p>
            <p className="text-sm font-medium text-[var(--text-primary)]">v1.0 — 18 Jun 2026</p>
          </div>
        </div>
      </section>

      {/* ── Section: Account Data ───────────────────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-blue-50 dark:bg-blue-900/20">
            <Database className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("account.title") || "Seus Dados"}
          </h3>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <Card label="E-mail" value={user?.email || "—"} icon={Mail} />
          <Card label="Nome" value={user?.name || "—"} icon={UserIcon} />
          <Card label="Provedor" value={session?.user?.id ? "Google OAuth" : "Email/Senha"} icon={HardDrive} />
        </div>
      </section>

      {/* ── Section: Actions (Export + Delete) ──────────────────── */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-6 shadow-[var(--shadow-sm)]">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
            <Shield className="h-5 w-5 text-[var(--brand-accent)]" />
          </div>
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            {t("actions.title") || "Ações de Privacidade"}
          </h3>
        </div>

        {/* Export */}
        <div className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] p-4 mb-3">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {t("actions.exportTitle") || "Exportar meus dados"}
            </p>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">
              Baixe todos os seus dados em formato JSON (LGPD Art. 18).
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={handleExport} loading={isExporting}>
            <Download className="h-3.5 w-3.5" />
            {t("actions.export") || "Exportar"}
          </Button>
        </div>

        {exportData && (
          <div className="mb-3 rounded-[var(--radius-md)] bg-[var(--color-success)]/10 border border-[var(--color-success)]/30 p-3 text-xs text-[var(--color-success)]">
            <CheckCircle className="h-3.5 w-3.5 inline mr-1" />
            Dados exportados com sucesso! O download começou automaticamente.
          </div>
        )}

        {/* Delete */}
        <div className="rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5 p-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[var(--color-danger)] flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4" />
                {t("actions.deleteTitle") || "Excluir minha conta"}
              </p>
              <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                Esta ação é irreversível. Todos os seus dados, workflows, agentes e integrações serão permanentemente removidos.
              </p>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-2">
            <input
              type="text"
              value={deleteConfirm}
              onChange={(e) => setDeleteConfirm(e.target.value)}
              placeholder='Digite "DELETAR" para confirmar'
              className="flex-1 h-9 rounded-[var(--radius-md)] border border-[var(--color-danger)]/30 bg-[var(--surface-0)] px-3 text-xs text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-danger)]/30"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={handleDelete}
              disabled={deleteConfirm !== "DELETAR" || isDeleting}
              loading={isDeleting}
              className="border-[var(--color-danger)] text-[var(--color-danger)] hover:bg-[var(--color-danger)] hover:text-white shrink-0"
            >
              <Trash2 className="h-3.5 w-3.5" />
              {t("actions.delete") || "Excluir conta"}
            </Button>
          </div>
        </div>

        {error && (
          <div className="mt-3 rounded-[var(--radius-md)] bg-[var(--color-danger)]/10 border border-[var(--color-danger)]/30 p-3 text-xs text-[var(--color-danger)]">
            <AlertTriangle className="h-3.5 w-3.5 inline mr-1" />
            {error}
          </div>
        )}
      </section>
    </div>
  );
}

/* ── Mini card ──────────────────────────────────────────────────── */

function Card({ label, value, icon: Icon }: { label: string; value: string; icon: React.ComponentType<{ className?: string }> }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] p-3">
      <div className="flex items-center gap-2 mb-1.5">
        <Icon className="h-3.5 w-3.5 text-[var(--text-tertiary)]" />
        <p className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">{label}</p>
      </div>
      <p className="text-sm font-medium text-[var(--text-primary)] truncate">{value}</p>
    </div>
  );
}

function UserIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

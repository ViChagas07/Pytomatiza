/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — Security Panel
   Mock controls for 2FA, password change, and session management.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck, KeyRound, Laptop, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function SecurityPanel() {
  const t = useTranslations("settings.security");

  return (
    <div className="space-y-8">
      <SettingRow
        icon={ShieldCheck}
        title={t("twoFactor")}
        description={t("twoFactorDescription")}
      >
        <button
          type="button"
          className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
        >
          {t("configure")}
        </button>
      </SettingRow>

      <SettingRow
        icon={KeyRound}
        title={t("changePassword")}
        description={t("changePasswordDescription")}
      >
        <button
          type="button"
          className="rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-1.5 text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--surface-2)] transition-colors"
        >
          {t("change")}
        </button>
      </SettingRow>

      <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
        <div className="flex items-start gap-4 mb-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
            <Laptop className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("activeSessions")}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{t("activeSessionsDescription")}</p>
          </div>
        </div>
        <ul className="space-y-2">
          <SessionItem device="Chrome on Windows" location="São Paulo, BR" current currentLabel={t("current")} revokeLabel={t("revoke")} />
          <SessionItem device="Safari on macOS" location="Cupertino, US" currentLabel={t("current")} revokeLabel={t("revoke")} />
        </ul>
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            className={cn(
              "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium",
              "text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/10 transition-colors"
            )}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            {t("revokeAll")}
          </button>
        </div>
      </div>
    </div>
  );
}

function SessionItem({
  device,
  location,
  current,
  currentLabel = "Current",
  revokeLabel = "Revoke",
}: {
  device: string;
  location: string;
  current?: boolean;
  currentLabel?: string;
  revokeLabel?: string;
}) {
  return (
    <li className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-1)] px-3 py-2">
      <div className="flex items-center gap-4">
        <Laptop className="h-4 w-4 text-[var(--text-tertiary)]" aria-hidden="true" />
        <div>
          <p className="text-sm text-[var(--text-primary)]">{device}</p>
          <p className="text-xs text-[var(--text-secondary)]">{location}</p>
        </div>
      </div>
      {current ? (
        <span className="rounded-full bg-[var(--color-success)]/10 px-2 py-0.5 text-[10px] font-semibold text-[var(--color-success)]">
          {currentLabel}
        </span>
      ) : (
        <button
          type="button"
          className="text-xs font-medium text-[var(--color-danger)] hover:underline"
        >
          {revokeLabel}
        </button>
      )}
    </li>
  );
}

function SettingRow({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--brand-accent-light)]">
            <Icon className="h-5 w-5 text-[var(--brand-accent)]" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{title}</h3>
            <p className="text-xs text-[var(--text-secondary)] mt-0.5">{description}</p>
          </div>
        </div>
        <div className="flex items-center">{children}</div>
      </div>
    </div>
  );
}

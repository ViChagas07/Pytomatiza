/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — Notifications Panel
   Toggles for email, in-app, push, and sound notifications.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import { useTranslations } from "next-intl";
import { Mail, Bell, Smartphone, Volume2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSettingsStore } from "@/store";

export function NotificationsPanel() {
  const t = useTranslations("settings.notifications");
  const {
    emailNotifications,
    setEmailNotifications,
    inAppNotifications,
    setInAppNotifications,
    pushNotifications,
    setPushNotifications,
    notificationSound,
    setNotificationSound,
  } = useSettingsStore();

  const items = [
    {
      key: "email",
      icon: Mail,
      title: t("email"),
      description: t("emailDescription"),
      checked: emailNotifications,
      onChange: setEmailNotifications,
    },
    {
      key: "inApp",
      icon: Bell,
      title: t("inApp"),
      description: t("inAppDescription"),
      checked: inAppNotifications,
      onChange: setInAppNotifications,
    },
    {
      key: "push",
      icon: Smartphone,
      title: t("push"),
      description: t("pushDescription"),
      checked: pushNotifications,
      onChange: setPushNotifications,
    },
    {
      key: "sound",
      icon: Volume2,
      title: t("sound"),
      description: t("soundDescription"),
      checked: notificationSound,
      onChange: setNotificationSound,
    },
  ];

  return (
    <div className="space-y-6">
      {items.map(({ key, icon: Icon, title, description, checked, onChange }) => (
        <div
          key={key}
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]"
        >
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
            <div className="flex items-center">
              <ToggleSwitch checked={checked} onChange={onChange} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors",
        checked ? "bg-[var(--brand-accent)]" : "bg-[var(--surface-2)]"
      )}
    >
      <span
        className={cn(
          "inline-block h-5 w-5 rounded-full bg-white shadow-sm transition-transform",
          checked ? "translate-x-6" : "translate-x-1"
        )}
      />
    </button>
  );
}

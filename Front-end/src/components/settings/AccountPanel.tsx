/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Settings — Account Panel
   Form for name, birth date, and profile picture.
   Blurred + login CTA when user is not authenticated.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { User, Camera, Lock, LogIn, UserPlus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

export function AccountPanel() {
  const t = useTranslations("settings.account");
  const { data: session, status } = useSession();
  const isAuthenticated = status === "authenticated";
  const [name, setName] = React.useState(session?.user?.name ?? "");
  const [birthDate, setBirthDate] = React.useState("");
  const [photoPreview, setPhotoPreview] = React.useState<string | null>(null);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoPreview(url);
    }
  };

  return (
    <div className="relative rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]">
      {/* Locked overlay for unauthenticated users */}
      {!isAuthenticated && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-[var(--radius-lg)] backdrop-blur-md bg-[var(--surface-0)]/60">
          <div className="flex flex-col items-center gap-4 p-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--surface-2)]">
              <Lock className="h-6 w-6 text-[var(--text-secondary)]" aria-hidden="true" />
            </div>
            <h3 className="text-base font-semibold text-[var(--text-primary)]">{t("lockedTitle")}</h3>
            <p className="text-sm text-[var(--text-secondary)] max-w-xs">{t("lockedDescription")}</p>
            <div className="flex gap-4 mt-1">
              <Link
                href="/login"
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium",
                  "bg-[var(--brand-accent)] text-white hover:bg-[var(--brand-accent-hover)] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
                )}
              >
                <LogIn className="h-4 w-4" aria-hidden="true" />
                {t("login")}
              </Link>
              <Link
                href="/register"
                className={cn(
                  "inline-flex items-center gap-2 rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium",
                  "border border-[var(--border-default)] text-[var(--text-primary)] hover:bg-[var(--surface-1)] transition-colors",
                  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]"
                )}
              >
                <UserPlus className="h-4 w-4" aria-hidden="true" />
                {t("register")}
              </Link>
            </div>
          </div>
        </div>
      )}

      <div className={cn("space-y-8", !isAuthenticated && "blur-[2px] select-none pointer-events-none")}>
        {/* Profile Picture */}
        <div className="flex items-center gap-6">
          <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-[var(--surface-2)] overflow-hidden">
            {photoPreview ? (
              <Image
                src={photoPreview}
                alt=""
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <User className="h-8 w-8 text-[var(--text-tertiary)]" aria-hidden="true" />
            )}
            <label
              htmlFor="photo-upload"
              className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
            >
              <Camera className="h-5 w-5 text-white" aria-hidden="true" />
            </label>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handlePhotoChange}
              disabled={!isAuthenticated}
            />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-[var(--text-primary)]">{t("profilePicture")}</h3>
            <div className="flex gap-2">
              <label
                htmlFor="photo-upload"
                className={cn(
                  "cursor-pointer inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium",
                  "bg-[var(--brand-accent-light)] text-[var(--brand-accent)] hover:bg-[var(--brand-accent-light)]/80 transition-colors"
                )}
              >
                <Camera className="h-3.5 w-3.5" aria-hidden="true" />
                {t("uploadPhoto")}
              </label>
              {photoPreview && (
                <button
                  type="button"
                  onClick={() => setPhotoPreview(null)}
                  className="inline-flex items-center gap-1.5 rounded-[var(--radius-md)] px-3 py-1.5 text-xs font-medium text-[var(--color-danger)] hover:bg-[var(--color-danger)]/10 transition-colors"
                  disabled={!isAuthenticated}
                >
                  {t("removePhoto")}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label htmlFor="account-name" className="text-sm font-medium text-[var(--text-primary)]">
              {t("fullName")}
            </label>
            <input
              id="account-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t("fullNamePlaceholder")}
              disabled={!isAuthenticated}
              className={cn(
                "w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--text-primary)]",
                "placeholder:text-[var(--text-tertiary)]",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="account-birthdate" className="text-sm font-medium text-[var(--text-primary)]">
              {t("birthDate")}
            </label>
            <input
              id="account-birthdate"
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              disabled={!isAuthenticated}
              className={cn(
                "w-full rounded-[var(--radius-md)] border border-[var(--border-default)] bg-[var(--surface-0)] px-3 py-2 text-sm text-[var(--text-primary)]",
                "focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-[var(--brand-accent)]",
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex justify-end">
          <button
            type="button"
            disabled={!isAuthenticated}
            className={cn(
              "rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-white transition-colors",
              "bg-[var(--brand-accent)] hover:bg-[var(--brand-accent-hover)]",
              "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-accent)]",
              "disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          >
            {t("saveChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}

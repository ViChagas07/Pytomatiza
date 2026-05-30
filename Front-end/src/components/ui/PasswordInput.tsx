/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — Password Input
   Password field with show/hide toggle. Fully accessible.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input, type InputProps } from "./Input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<InputProps, "type">;

export const PasswordInput = React.forwardRef<
  HTMLInputElement,
  PasswordInputProps
>(({ className, ...props }, ref) => {
  const t = useTranslations("a11y");
  const [visible, setVisible] = React.useState(false);

  const toggleLabel = visible ? t("hidePassword") : t("showPassword");

  return (
    <div className="relative">
      <Input
        ref={ref}
        type={visible ? "text" : "password"}
        autoComplete="current-password"
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        className={cn(
          "absolute right-1 top-[1.625rem] -translate-y-1/2",
          "inline-flex h-8 w-8 items-center justify-center",
          "rounded-[var(--radius-sm)]",
          "text-[var(--text-tertiary)] hover:text-[var(--text-primary)]",
          "focus-visible:outline-2 focus-visible:outline-offset-1",
          "focus-visible:outline-[var(--brand-accent)]"
        )}
        aria-label={toggleLabel}
        data-testid="password-toggle"
      >
        {visible ? (
          <EyeOff className="h-4 w-4" aria-hidden="true" />
        ) : (
          <Eye className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
});

PasswordInput.displayName = "PasswordInput";

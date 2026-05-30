/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — Input
   Accessible text input with label, error, and helper text.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  /** Visible label (required for a11y) */
  label: string;
  /** Error message — also linked via aria-describedby */
  error?: string;
  /** Helper text below the input */
  helperText?: string;
  /** Hide the label visually but keep it for screen readers */
  hideLabel?: boolean;
  /** The container className */
  wrapperClassName?: string;
  /** Class name for the label element */
  labelClassName?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      error,
      helperText,
      hideLabel = false,
      wrapperClassName,
      labelClassName,
      className,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = React.useId();
    const inputId = id || generatedId;
    const errorId = `${inputId}-error`;
    const helperId = `${inputId}-helper`;
    const hasError = Boolean(error);

    const describedBy = [
      hasError ? errorId : null,
      helperText ? helperId : null,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        <label
          htmlFor={inputId}
          className={cn(
            "text-sm font-medium text-[var(--text-primary)]",
            hideLabel && "sr-only",
            labelClassName
          )}
        >
          {label}
        </label>

        <input
          ref={ref}
          id={inputId}
          aria-invalid={hasError ? true : undefined}
          aria-describedby={describedBy}
          data-testid="input"
          className={cn(
            "flex h-11 w-full rounded-[var(--radius-md)]",
            "bg-[var(--surface-0)] px-3 py-2 text-sm",
            "border transition-colors",
            "placeholder:text-[var(--text-tertiary)]",
            "focus-visible:outline-2 focus-visible:outline-offset-1",
            "focus-visible:outline-[var(--brand-accent)]",
            "disabled:cursor-not-allowed disabled:opacity-50",
            hasError
              ? "border-[var(--color-danger)] focus-visible:outline-[var(--color-danger)]"
              : "border-[var(--border-default)] hover:border-[var(--border-strong)]",
            className
          )}
          {...props}
        />

        {hasError && (
          <p
            id={errorId}
            role="alert"
            className="text-xs text-[var(--color-danger)]"
            data-testid="input-error"
          >
            {error}
          </p>
        )}

        {helperText && !hasError && (
          <p
            id={helperId}
            className="text-xs text-[var(--text-tertiary)]"
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

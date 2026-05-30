/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — Button
   Polymorphic button with variants, sizes, loading state, and a11y.
   ═══════════════════════════════════════════════════════════════════ */

"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

/* ── Variants ────────────────────────────────────────────────────── */

const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "text-sm font-medium transition-colors",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "focus-visible:outline-[var(--brand-accent)]",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
    "min-h-[44px] min-w-[44px]", // WCAG touch target
  ],
  {
    variants: {
      variant: {
        primary:
          "bg-[var(--brand-accent)] text-[var(--text-inverse)] hover:bg-[var(--brand-accent-hover)]",
        secondary:
          "bg-[var(--surface-2)] text-[var(--text-primary)] hover:bg-[var(--border-default)]",
        outline:
          "border border-[var(--border-default)] bg-transparent hover:bg-[var(--surface-1)] text-[var(--text-primary)]",
        ghost:
          "bg-transparent hover:bg-[var(--surface-1)] text-[var(--text-secondary)]",
        danger:
          "bg-[var(--color-danger)] text-white hover:bg-[#c93a39]",
        accent:
          "bg-[var(--brand-accent)] text-[var(--text-inverse)] hover:bg-[var(--brand-accent-hover)]",
      },
      size: {
        sm: "h-9 px-3 text-xs rounded-[var(--radius-sm)]",
        md: "h-10 px-4 text-sm rounded-[var(--radius-md)]",
        lg: "h-12 px-6 text-base rounded-[var(--radius-md)]",
        icon: "h-10 w-10 rounded-[var(--radius-md)]",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

/* ── Props ───────────────────────────────────────────────────────── */

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render as a child element (e.g., Link) */
  asChild?: boolean;
  /** Show a loading spinner */
  loading?: boolean;
  /** Accessible label for icon-only buttons */
  "aria-label"?: string;
}

/* ── Component ───────────────────────────────────────────────────── */

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      "aria-label": ariaLabel,
      ...props
    },
    ref
  ) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        aria-busy={loading ? true : undefined}
        aria-label={ariaLabel}
        data-testid="button"
        {...props}
      >
        {loading && (
          <Loader2
            className="h-4 w-4 animate-spin"
            aria-hidden="true"
            data-testid="button-spinner"
          />
        )}
        {children}
      </Comp>
    );
  }
);

Button.displayName = "Button";

export { buttonVariants };

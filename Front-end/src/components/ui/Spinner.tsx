/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — Spinner
   Accessible loading indicator with aria-live region.
   ═══════════════════════════════════════════════════════════════════ */

import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface SpinnerProps {
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Accessible label for screen readers */
  label?: string;
  /** Additional classes */
  className?: string;
}

const sizeMap = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-8 w-8",
} as const;

export function Spinner({ size = "md", label = "Loading", className }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} data-testid="spinner">
      <Loader2
        className={cn("animate-spin text-[var(--text-tertiary)]", sizeMap[size], className)}
        aria-hidden="true"
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}

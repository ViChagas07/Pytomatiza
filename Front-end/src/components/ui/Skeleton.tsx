/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI — Skeleton
   Loading placeholder with shimmer animation. No layout shift.
   ═══════════════════════════════════════════════════════════════════ */

import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      aria-hidden="true"
      data-testid="skeleton"
      className={cn(
        "animate-pulse rounded-[var(--radius-md)] bg-[var(--border-default)]",
        className
      )}
    />
  );
}

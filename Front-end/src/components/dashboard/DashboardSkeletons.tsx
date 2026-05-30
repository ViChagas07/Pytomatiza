/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Dashboard — Loading Skeletons
   No-layout-shift placeholders for async data sections.
   ═══════════════════════════════════════════════════════════════════ */

import { Skeleton } from "@/components/ui/Skeleton";

export function StatsSkeleton() {
  return (
    <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)]"
        >
          <Skeleton className="mb-3 h-4 w-20" />
          <Skeleton className="h-8 w-16" />
        </div>
      ))}
    </div>
  );
}

export function AgentCardsSkeleton() {
  return (
    <div
      className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3"
      aria-hidden="true"
      data-testid="agent-cards-skeleton"
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="rounded-[var(--radius-lg)] border border-[var(--border-default)] bg-[var(--surface-0)] p-5 shadow-[var(--shadow-sm)] space-y-5"
        >
          <div className="flex justify-between">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-5 w-5 rounded-full" />
          </div>
          <Skeleton className="h-5 w-3/4" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-2/3" />
          <div className="flex gap-6 pt-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-2 pt-2 border-t border-[var(--border-default)]">
            <Skeleton className="h-8 w-20 rounded-[var(--radius-sm)]" />
            <Skeleton className="h-8 w-20 rounded-[var(--radius-sm)]" />
          </div>
        </div>
      ))}
    </div>
  );
}

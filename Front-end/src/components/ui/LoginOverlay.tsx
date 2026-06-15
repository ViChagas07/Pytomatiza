"use client";

import { type ReactNode } from "react";
import { LogIn, ArrowRight } from "lucide-react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { useSession } from "next-auth/react";

/**
 * Full-content login overlay shown when the user is NOT authenticated.
 * Renders `children` with a backdrop blur effect and a centered call-to-action
 * card encouraging the user to sign in / create an account.
 *
 * When the user IS authenticated, `children` renders normally with no overlay.
 */
interface LoginOverlayProps {
  /** Translated prompt text (e.g. "Faça login ou cadastre-se…") */
  label: string;
  /** Content to blur / protect behind the login prompt */
  children: ReactNode;
}

export function LoginOverlay({ label, children }: LoginOverlayProps) {
  const locale = useLocale();
  const { status } = useSession();
  const isSessionLoaded = status !== "loading";
  const isAuthenticated = status === "authenticated";

  /* Not ready yet or already authenticated → render children as-is */
  if (!isSessionLoaded || isAuthenticated) return <>{children}</>;

  return (
    <div className="relative">
      {/* Blurred background content */}
      <div
        className="pointer-events-none select-none"
        style={{ filter: "blur(5px)", WebkitFilter: "blur(5px)" }}
        aria-hidden="true"
      >
        {children}
      </div>

      {/* Centered overlay card */}
      <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
        <Link
          href={`/${locale}/login`}
          className="group flex max-w-md items-center gap-4 rounded-[var(--radius-lg)] border border-amber-300/60 bg-amber-50 px-6 py-4 shadow-lg transition-all hover:bg-amber-100 hover:shadow-xl no-underline"
          role="alert"
        >
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-200/60">
            <LogIn className="h-5 w-5 text-amber-700" aria-hidden="true" />
          </div>
          <span className="flex-1 text-sm font-medium text-amber-900 leading-relaxed">
            {label}
          </span>
          <ArrowRight className="h-5 w-5 shrink-0 text-amber-600 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

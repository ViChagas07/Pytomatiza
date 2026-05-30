/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ Typed Navigation
   Drop-in replacements for next-intl Link/redirect/navigation.
   ═══════════════════════════════════════════════════════════════════ */

import { createNavigation } from "next-intl/navigation";
import { locales } from "./config";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales,
    localePrefix: "always",
  });

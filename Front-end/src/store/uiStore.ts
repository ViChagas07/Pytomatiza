/* ═══════════════════════════════════════════════════════════════════
   Pytomatiza+ UI Store
   Tracks sidebar state, mobile menu, and global UI toggles.
   ═══════════════════════════════════════════════════════════════════ */

import { create } from "zustand";

interface UIStore {
  /** Whether the sidebar is collapsed (desktop) */
  sidebarCollapsed: boolean;
  /** Whether the mobile menu is open */
  mobileMenuOpen: boolean;

  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
}

export const useUIStore = create<UIStore>((set) => ({
  sidebarCollapsed: false,
  mobileMenuOpen: false,

  toggleSidebar: () =>
    set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

  setMobileMenuOpen: (open) => set({ mobileMenuOpen: open }),
}));

"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/** UI-only state (never server data). Persisted to localStorage. */
interface UiState {
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
    }),
    {
      name: "carrivo-ui",
      storage: createJSONStorage(() => localStorage),
      // Rehydrated after mount (DashboardShell) so server and first client render match.
      skipHydration: true,
      partialize: (state) => ({ sidebarCollapsed: state.sidebarCollapsed }),
    },
  ),
);

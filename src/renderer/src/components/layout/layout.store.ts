import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  sidebarCollapsed: boolean
  showChecklist: boolean

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleChecklist: () => void
  setShowChecklist: (show: boolean) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      showChecklist: true,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleChecklist: () =>
        set((state) => ({ showChecklist: !state.showChecklist })),

      setShowChecklist: (show) => set({ showChecklist: show }),
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    },
  ),
)

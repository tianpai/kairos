import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  sidebarCollapsed: boolean
  showChecklist: boolean
  settingsSidebarCollapsed: boolean

  // Actions
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  toggleChecklist: () => void
  setShowChecklist: (show: boolean) => void
  toggleSettingsSidebar: () => void
  setSettingsSidebarCollapsed: (collapsed: boolean) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarCollapsed: false,
      showChecklist: true,
      settingsSidebarCollapsed: false,

      toggleSidebar: () =>
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),

      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      toggleChecklist: () =>
        set((state) => ({ showChecklist: !state.showChecklist })),

      setShowChecklist: (show) => set({ showChecklist: show }),

      toggleSettingsSidebar: () =>
        set((state) => ({
          settingsSidebarCollapsed: !state.settingsSidebarCollapsed,
        })),

      setSettingsSidebarCollapsed: (collapsed) =>
        set({ settingsSidebarCollapsed: collapsed }),
    }),
    {
      name: 'layout-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        settingsSidebarCollapsed: state.settingsSidebarCollapsed,
      }),
    },
  ),
)

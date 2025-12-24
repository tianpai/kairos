import { create } from 'zustand'

type NavigationDirection = 'prev' | 'next' | 'oldest' | 'latest'

interface ShortcutState {
  // Flags
  newApplicationRequested: boolean
  saveRequested: boolean
  exportPdfRequested: boolean
  documentSettingsRequested: boolean
  tailorRequested: boolean
  navigationRequested: NavigationDirection | null

  // Actions
  requestNewApplication: () => void
  clearNewApplicationRequest: () => void

  requestSave: () => void
  clearSaveRequest: () => void

  requestExportPdf: () => void
  clearExportPdfRequest: () => void

  requestDocumentSettings: () => void
  clearDocumentSettingsRequest: () => void

  requestTailor: () => void
  clearTailorRequest: () => void

  requestNavigation: (direction: NavigationDirection) => void
  clearNavigationRequest: () => void
}

export const useShortcutStore = create<ShortcutState>()((set) => ({
  // Initial state
  newApplicationRequested: false,
  saveRequested: false,
  exportPdfRequested: false,
  documentSettingsRequested: false,
  tailorRequested: false,
  navigationRequested: null,

  // Actions
  requestNewApplication: () => set({ newApplicationRequested: true }),
  clearNewApplicationRequest: () => set({ newApplicationRequested: false }),

  requestSave: () => set({ saveRequested: true }),
  clearSaveRequest: () => set({ saveRequested: false }),

  requestExportPdf: () => set({ exportPdfRequested: true }),
  clearExportPdfRequest: () => set({ exportPdfRequested: false }),

  requestDocumentSettings: () => set({ documentSettingsRequested: true }),
  clearDocumentSettingsRequest: () => set({ documentSettingsRequested: false }),

  requestTailor: () => set({ tailorRequested: true }),
  clearTailorRequest: () => set({ tailorRequested: false }),

  requestNavigation: (direction) => set({ navigationRequested: direction }),
  clearNavigationRequest: () => set({ navigationRequested: null }),
}))

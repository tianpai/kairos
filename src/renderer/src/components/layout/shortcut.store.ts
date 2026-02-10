import { create } from 'zustand'

interface ShortcutState {
  // Flags
  newApplicationRequested: boolean
  saveRequested: boolean
  exportPdfRequested: boolean
  documentSettingsRequested: boolean
  tailorRequested: boolean

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
}

export const useShortcutStore = create<ShortcutState>()((set) => ({
  // Initial state
  newApplicationRequested: false,
  saveRequested: false,
  exportPdfRequested: false,
  documentSettingsRequested: false,
  tailorRequested: false,

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
}))

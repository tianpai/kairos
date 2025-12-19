import { create } from 'zustand'

interface ShortcutState {
  newApplicationRequested: boolean
  buildFromScratchRequested: boolean

  // Actions
  requestNewApplication: () => void
  clearNewApplicationRequest: () => void
  requestBuildFromScratch: () => void
  clearBuildFromScratchRequest: () => void
}

export const useShortcutStore = create<ShortcutState>()((set) => ({
  newApplicationRequested: false,
  buildFromScratchRequested: false,

  requestNewApplication: () => set({ newApplicationRequested: true }),
  clearNewApplicationRequest: () => set({ newApplicationRequested: false }),
  requestBuildFromScratch: () => set({ buildFromScratchRequested: true }),
  clearBuildFromScratchRequest: () => set({ buildFromScratchRequested: false }),
}))

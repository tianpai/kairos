import { create } from 'zustand'

interface ShortcutState {
  newApplicationRequested: boolean

  // Actions
  requestNewApplication: () => void
  clearNewApplicationRequest: () => void
}

export const useShortcutStore = create<ShortcutState>()((set) => ({
  newApplicationRequested: false,

  requestNewApplication: () => set({ newApplicationRequested: true }),
  clearNewApplicationRequest: () => set({ newApplicationRequested: false }),
}))

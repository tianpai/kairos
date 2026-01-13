import { create } from 'zustand'

interface BatchExportState {
  isOpen: boolean
}

interface BatchExportActions {
  open: () => void
  close: () => void
  toggle: () => void
}

type BatchExportStore = BatchExportState & BatchExportActions

const initialState: BatchExportState = {
  isOpen: false,
}

export const useBatchExportStore = create<BatchExportStore>()((set) => ({
  ...initialState,

  open: () => set({ isOpen: true }),

  close: () => set({ isOpen: false }),

  toggle: () => set((state) => ({ isOpen: !state.isOpen })),
}))

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTipById } from './tips.data'
import type { TipId, TipState } from './tips.types'

const TOAST_WINDOW_MS = 10000 // Batch deduplication window for same-event tips

// Store timeout ref outside Zustand state (not persisted, runtime only)
let toastClearTimeout: ReturnType<typeof setTimeout> | null = null

function clearToastTimeout() {
  if (toastClearTimeout) {
    clearTimeout(toastClearTimeout)
    toastClearTimeout = null
  }
}

export const useTipsStore = create<TipState>()(
  persist(
    (set, get) => ({
      shownCount: {},
      completedActions: [],
      tipsEnabled: true,
      activeToastTip: null, // Ensures only one tip visible at a time
      lastShownInToastAt: {}, // Tracks per-tip timing for batch deduplication

      canShow: (tipId: TipId) => {
        const state = get()

        if (!state.tipsEnabled) {
          return false
        }

        // Check if tip is currently showing in toast
        if (state.activeToastTip !== null) {
          return false
        }

        return true
      },

      incrementShownCount: (tipId: TipId) => {
        set((state) => ({
          shownCount: {
            ...state.shownCount,
            [tipId]: (state.shownCount[tipId] || 0) + 1,
          },
        }))
      },

      markActionCompleted: (action: string) => {
        const state = get()
        if (!state.completedActions.includes(action)) {
          set({ completedActions: [...state.completedActions, action] })
        }
      },

      isFirstTime: (action: string) => {
        return !get().completedActions.includes(action)
      },

      reset: () => {
        clearToastTimeout()
        set({
          activeToastTip: null,
          shownCount: {},
          completedActions: [],
          lastShownInToastAt: {},
        })
      },

      setTipsEnabled: (enabled: boolean) => {
        set({ tipsEnabled: enabled })
      },

      setToastTip: (tipId: TipId | null) => {
        const { activeToastTip } = get()
        if (activeToastTip !== tipId) {
          clearToastTimeout()
          set((state) => ({
            activeToastTip: tipId,
            lastShownInToastAt: {
              ...state.lastShownInToastAt,
              ...(tipId ? { [tipId]: Date.now() } : {}),
            },
          }))

          // Auto-clear after toast window
          if (tipId) {
            toastClearTimeout = setTimeout(() => {
              get().setToastTip(null)
            }, TOAST_WINDOW_MS)
          }
        }
      },

      isToastTipShowing: (tipId: TipId) => {
        const { lastShownInToastAt } = get()
        const lastShown = lastShownInToastAt[tipId]
        if (!lastShown) return false

        const elapsed = Date.now() - lastShown
        return elapsed < TOAST_WINDOW_MS
      },

      getActiveToastTip: () => {
        const { activeToastTip } = get()
        if (!activeToastTip) return null
        return getTipById(activeToastTip) ?? null
      },
    }),
    {
      name: 'tips-storage-v2',
      partialize: (state) => ({
        shownCount: state.shownCount,
        completedActions: state.completedActions,
        tipsEnabled: state.tipsEnabled,
        // Don't persist lastShownInToastAt - only relevant for 10s window
      }),
    },
  ),
)

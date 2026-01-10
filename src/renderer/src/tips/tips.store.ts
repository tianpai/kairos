import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { getTipById } from './tips.data'
import type { TipId, TipState } from './tips.types'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000
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
      dismissedAt: {},
      neverShowAgain: [],
      completedActions: [],
      cooldownMs: SEVEN_DAYS_MS,
      activeToastTip: null, // Ensures only one tip visible at a time
      lastShownInToastAt: {}, // Tracks per-tip timing for batch deduplication

      dismiss: () => {
        const { activeToastTip } = get()
        if (!activeToastTip) return

        clearToastTimeout()
        set((state) => ({
          activeToastTip: null,
          dismissedAt: {
            ...state.dismissedAt,
            [activeToastTip]: Date.now(),
          },
        }))
      },

      neverShow: () => {
        const { activeToastTip } = get()
        if (!activeToastTip) return

        clearToastTimeout()
        set((state) => ({
          activeToastTip: null,
          neverShowAgain: [...state.neverShowAgain, activeToastTip],
        }))
      },

      canShow: (tipId: TipId) => {
        const state = get()

        // Check if permanently dismissed
        if (state.neverShowAgain.includes(tipId)) {
          return false
        }

        // Check if in cooldown
        const dismissedTime = state.dismissedAt[tipId]
        if (dismissedTime) {
          const elapsed = Date.now() - dismissedTime
          if (elapsed < state.cooldownMs) {
            return false
          }
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
          dismissedAt: {},
          neverShowAgain: [],
          completedActions: [],
          lastShownInToastAt: {},
        })
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
      name: 'tips-storage',
      partialize: (state) => ({
        shownCount: state.shownCount,
        dismissedAt: state.dismissedAt,
        neverShowAgain: state.neverShowAgain,
        completedActions: state.completedActions,
        cooldownMs: state.cooldownMs,
        // Don't persist lastShownInToastAt - only relevant for 10s window
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) return

        const now = Date.now()

        // Clean up expired dismissedAt entries (older than cooldown)
        const cleanedDismissedAt: Record<string, number> = {}
        for (const [tipId, timestamp] of Object.entries(state.dismissedAt)) {
          if (now - timestamp < state.cooldownMs) {
            cleanedDismissedAt[tipId] = timestamp
          }
        }

        // Update state if any entries were cleaned
        if (
          Object.keys(cleanedDismissedAt).length !==
          Object.keys(state.dismissedAt).length
        ) {
          state.dismissedAt = cleanedDismissedAt
        }
      },
    },
  ),
)

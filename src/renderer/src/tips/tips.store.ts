import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Tip, TipId, TipState } from './tips.types'

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

export const useTipsStore = create<TipState>()(
  persist(
    (set, get) => ({
      activeTip: null,
      shownCount: {},
      dismissedAt: {},
      neverShowAgain: [],
      completedActions: [],
      cooldownMs: SEVEN_DAYS_MS,

      showTip: (tip: Tip) => {
        const state = get()
        if (!state.canShow(tip.id)) return

        set({ activeTip: tip })
        state.incrementShownCount(tip.id)
      },

      dismiss: () => {
        const { activeTip } = get()
        if (!activeTip) return

        set((state) => ({
          activeTip: null,
          dismissedAt: {
            ...state.dismissedAt,
            [activeTip.id]: Date.now(),
          },
        }))
      },

      neverShow: () => {
        const { activeTip } = get()
        if (!activeTip) return

        set((state) => ({
          activeTip: null,
          neverShowAgain: [...state.neverShowAgain, activeTip.id],
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

        // Check if another tip is already showing
        if (state.activeTip !== null) {
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
        set({
          activeTip: null,
          shownCount: {},
          dismissedAt: {},
          neverShowAgain: [],
          completedActions: [],
        })
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
      }),
    },
  ),
)

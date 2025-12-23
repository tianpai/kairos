import { useTipsStore } from './tips.store'
import { getTipById, getTipsByEvent } from './tips.data'
import type { Tip, TipCondition } from './tips.types'

interface TipContext {
  score?: number
  actionCounts?: Record<string, number>
  firstTimeActions?: Array<string>
}

function evaluateCondition(
  condition: TipCondition,
  context: TipContext,
  currentEvent?: string,
): boolean {
  switch (condition.type) {
    case 'event':
      return condition.event === currentEvent

    case 'score': {
      if (context.score === undefined) return false
      const { operator, value } = condition
      if (operator === '<') return context.score < value
      if (operator === '>') return context.score > value
      return context.score === value
    }

    case 'count': {
      const count = context.actionCounts?.[condition.action] ?? 0
      if (condition.operator === '<') return count < condition.value
      return count > condition.value
    }

    case 'firstTime':
      return context.firstTimeActions?.includes(condition.action) ?? false

    default:
      return false
  }
}

function evaluateAllConditions(
  tip: Tip,
  context: TipContext,
  currentEvent?: string,
): boolean {
  return tip.conditions.every((condition) =>
    evaluateCondition(condition, context, currentEvent),
  )
}

function tryShowTip(tip: Tip): boolean {
  const store = useTipsStore.getState()
  if (store.canShow(tip.id)) {
    store.showTip(tip)
    return true
  }
  return false
}

export const tip = {
  /**
   * Trigger an event and show matching tips
   * @param event - Event name (e.g., 'tailoring.complete')
   * @param context - Optional context for condition evaluation
   */
  trigger: (event: string, context: TipContext = {}): boolean => {
    const store = useTipsStore.getState()
    const matchingTips = getTipsByEvent(event)

    // Build list of first-time actions from the tips we're checking
    const firstTimeActions: string[] = []
    for (const t of matchingTips) {
      for (const condition of t.conditions) {
        if (condition.type === 'firstTime' && store.isFirstTime(condition.action)) {
          firstTimeActions.push(condition.action)
        }
      }
    }

    const enrichedContext = { ...context, firstTimeActions }

    for (const t of matchingTips) {
      if (evaluateAllConditions(t, enrichedContext, event)) {
        if (tryShowTip(t)) {
          // Mark first-time actions as completed after showing tip
          for (const condition of t.conditions) {
            if (condition.type === 'firstTime') {
              store.markActionCompleted(condition.action)
            }
          }
          return true
        }
      }
    }
    return false
  },

  /**
   * Force show a specific tip by ID
   * @param tipId - The tip ID to show
   */
  show: (tipId: string): boolean => {
    const t = getTipById(tipId)
    if (!t) {
      console.warn(`Tip not found: ${tipId}`)
      return false
    }
    return tryShowTip(t)
  },

  /**
   * Dismiss the currently shown tip (with cooldown)
   */
  dismiss: (): void => {
    useTipsStore.getState().dismiss()
  },

  /**
   * Permanently dismiss the currently shown tip
   */
  neverShow: (): void => {
    useTipsStore.getState().neverShow()
  },
}

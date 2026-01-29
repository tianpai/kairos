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

/** Hybrid selection: prioritize never-shown tips, then random among equals */
function selectTip(tips: Array<Tip>, shownCount: Record<string, number>): Tip {
  // Find the minimum shown count
  const minCount = Math.min(...tips.map((t) => shownCount[t.id] ?? 0))

  // Filter to tips with that count (prioritizes never-shown)
  const candidates = tips.filter((t) => (shownCount[t.id] ?? 0) === minCount)

  // Random selection among equals
  return candidates[Math.floor(Math.random() * candidates.length)]
}

export const tip = {
  /**
   * Get tip message to append to success toast
   * @param event - Event name (e.g., 'tailoring.complete')
   * @param context - Optional context for condition evaluation
   * @returns Tip message if should show, null otherwise
   */
  appendToSuccess: (event: string, context: TipContext = {}): string | null => {
    const store = useTipsStore.getState()
    if (!store.tipsEnabled) return null

    const matchingTips = getTipsByEvent(event)

    // Build list of first-time actions from matching tips
    const firstTimeActions: Array<string> = []
    for (const t of matchingTips) {
      for (const condition of t.conditions) {
        if (
          condition.type === 'firstTime' &&
          store.isFirstTime(condition.action)
        ) {
          firstTimeActions.push(condition.action)
        }
      }
    }

    const enrichedContext = { ...context, firstTimeActions }

    // Collect all eligible tips
    const eligibleTips: Array<Tip> = []
    for (const t of matchingTips) {
      if (evaluateAllConditions(t, enrichedContext, event)) {
        // Batch deduplication: if this tip was just shown, suppress ALL tips
        if (store.isToastTipShowing(t.id)) {
          return null
        }
        if (store.canShow(t.id)) {
          eligibleTips.push(t)
        }
      }
    }

    if (eligibleTips.length === 0) return null

    // Hybrid selection: prioritize never-shown, then random among equals
    const selected = selectTip(eligibleTips, store.shownCount)

    // Mark tip as showing in toast
    store.setToastTip(selected.id)

    // Mark first-time actions as completed
    for (const condition of selected.conditions) {
      if (condition.type === 'firstTime') {
        store.markActionCompleted(condition.action)
      }
    }

    // Increment shown count
    store.incrementShownCount(selected.id)

    return selected.message
  },

  /**
   * Force show a specific tip by ID (for manual tip display if needed)
   * @param tipId - The tip ID to show
   */
  show: (tipId: string): boolean => {
    const store = useTipsStore.getState()
    const t = getTipById(tipId)
    if (!t) {
      console.warn(`Tip not found: ${tipId}`)
      return false
    }

    // Check if tip can be shown
    if (!store.canShow(t.id)) {
      return false
    }

    // Mark as showing in toast
    store.setToastTip(t.id)

    // Increment shown count
    store.incrementShownCount(t.id)

    return true
  },

}

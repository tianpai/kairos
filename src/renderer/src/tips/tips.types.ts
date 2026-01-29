export type TipId = string

export type TipCategory =
  | 'knockout'
  | 'keywords'
  | 'phrasing'
  | 'consistency'
  | 'position'

export type TipCondition =
  | { type: 'event'; event: string }
  | { type: 'score'; operator: '<' | '>' | '='; value: number }
  | { type: 'count'; action: string; operator: '<' | '>'; value: number }
  | { type: 'firstTime'; action: string }

export const CATEGORY_LABELS: Record<TipCategory, { label: string }> = {
  knockout: { label: 'Knockout' },
  keywords: { label: 'Keywords' },
  phrasing: { label: 'Phrasing' },
  consistency: { label: 'Consistency' },
  position: { label: 'Position' },
}

export interface Tip {
  id: TipId
  category: TipCategory
  message: string
  conditions: Array<TipCondition>
  learnMoreUrl?: string
}

export interface TipState {
  // Tracking
  shownCount: Record<TipId, number>
  completedActions: Array<string> // Actions user has done at least once

  // Config
  tipsEnabled: boolean

  // Toast tip tracking
  activeToastTip: TipId | null
  lastShownInToastAt: Record<TipId, number>

  // Actions
  canShow: (tipId: TipId) => boolean
  incrementShownCount: (tipId: TipId) => void
  markActionCompleted: (action: string) => void
  isFirstTime: (action: string) => boolean
  reset: () => void
  setTipsEnabled: (enabled: boolean) => void
  setToastTip: (tipId: TipId | null) => void
  isToastTipShowing: (tipId: TipId) => boolean
  getActiveToastTip: () => Tip | null
}

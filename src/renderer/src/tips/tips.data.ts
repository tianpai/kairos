import type { Tip } from './tips.types'

export const tips: Array<Tip> = [
  {
    id: 'first-tailoring',
    category: 'knockout',
    message:
      'Always review AI changes - you know your experience better than AI does.',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
      { type: 'firstTime', action: 'tailoring' },
    ],
  },
  {
    id: 'low-score',
    category: 'knockout',
    message:
      'Low score? Check knockout requirements - missing one can get you auto-rejected.',
    conditions: [
      { type: 'event', event: 'score.updated' },
      { type: 'score', operator: '<', value: 60 },
    ],
  },
  {
    id: 'first-checklist',
    category: 'knockout',
    message:
      'Hard requirements (red) are knockout criteria. Missing even one can get you auto-rejected. Focus on these first.',
    conditions: [
      { type: 'event', event: 'checklist.parsed' },
      { type: 'firstTime', action: 'checklist' },
    ],
  },
]

export function getTipById(id: string): Tip | undefined {
  return tips.find((tip) => tip.id === id)
}

export function getTipsByEvent(event: string): Array<Tip> {
  return tips.filter((tip) =>
    tip.conditions.some((c) => c.type === 'event' && c.event === event),
  )
}

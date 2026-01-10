import type { Tip } from './tips.types'

export const tips: Array<Tip> = [
  // Knockout
  {
    id: 'first-tailoring',
    category: 'knockout',
    message: 'Review AI changes. You know your experience better than AI.',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
      { type: 'firstTime', action: 'tailoring' },
    ],
  },
  {
    id: 'low-score',
    category: 'knockout',
    message: 'Check knockout requirements. Missing one can get auto-rejected.',
    conditions: [
      { type: 'event', event: 'score.updated' },
      { type: 'score', operator: '<', value: 60 },
    ],
  },
  {
    id: 'first-checklist',
    category: 'knockout',
    message: 'Hard requirements are knockout criteria. Focus on these first.',
    conditions: [
      { type: 'event', event: 'checklist.parsed' },
      { type: 'firstTime', action: 'checklist' },
    ],
  },

  // Keywords
  {
    id: 'exact-phrases',
    category: 'keywords',
    message: 'Match exact phrases from the job description when possible.',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
      { type: 'firstTime', action: 'tailoring' },
    ],
  },
  {
    id: 'keyword-stuffing',
    category: 'keywords',
    message: "Don't keyword stuff. ATS passes, but humans reject.",
    conditions: [
      { type: 'event', event: 'score.updated' },
      { type: 'score', operator: '>', value: 90 },
    ],
  },

  // Phrasing
  {
    id: 'quantify-impact',
    category: 'phrasing',
    message: 'Quantify impact. "Increased sales 40%" beats "improved sales".',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
      { type: 'firstTime', action: 'tailoring' },
    ],
  },
  {
    id: 'action-verbs',
    category: 'phrasing',
    message: 'Start bullets with action verbs: Led, Built, Reduced, Launched.',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
    ],
  },

  // Consistency
  {
    id: 'date-format',
    category: 'consistency',
    message: 'Keep date formats consistent. "Jan 2024" and "01/2024" looks sloppy.',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
      { type: 'firstTime', action: 'tailoring' },
    ],
  },
  {
    id: 'tense-consistency',
    category: 'consistency',
    message: 'Current role = present tense. Past roles = past tense.',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
    ],
  },

  // Position
  {
    id: 'relevant-first',
    category: 'position',
    message: 'Put most relevant experience first, even if not most recent.',
    conditions: [
      { type: 'event', event: 'tailoring.complete' },
      { type: 'firstTime', action: 'tailoring' },
    ],
  },
  {
    id: 'skills-placement',
    category: 'position',
    message: 'Skills section works best near the top for ATS scanning.',
    conditions: [
      { type: 'event', event: 'checklist.parsed' },
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

export function getTipsByCategory(category: string): Array<Tip> {
  if (category === 'all') return tips
  return tips.filter((tip) => tip.category === category)
}

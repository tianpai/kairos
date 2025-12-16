/**
 * Score color thresholds and utilities for match percentage visualization
 */

export const SCORE_COLORS = {
  RED: '#EF4444',
  ORANGE: '#F97316',
  YELLOW: '#EAB308',
  GREEN: '#009951',
  GRAY: '#D9D9D9',
} as const

const SCORE_THRESHOLDS = {
  POOR: 30,
  FAIR: 50,
  GOOD: 70,
} as const

/**
 * Get the appropriate color for a given score percentage
 */
export function getScoreColor(percent: number): string {
  if (percent < SCORE_THRESHOLDS.POOR) return SCORE_COLORS.RED
  if (percent < SCORE_THRESHOLDS.FAIR) return SCORE_COLORS.ORANGE
  if (percent < SCORE_THRESHOLDS.GOOD) return SCORE_COLORS.YELLOW
  return SCORE_COLORS.GREEN
}

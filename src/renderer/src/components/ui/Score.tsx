import { getScoreColor } from '@/utils/scoreThresholds'

export function Score({ score }: { score: number }) {
  return (
    <span
      className="mr-2 text-sm font-medium"
      style={{ color: getScoreColor(score) }}
    >
      {Math.round(score)}%
    </span>
  )
}

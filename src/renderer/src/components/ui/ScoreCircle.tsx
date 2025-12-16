import { SCORE_COLORS, getScoreColor } from '@/utils/scoreThresholds'

export interface ScoreCircleProps {
  percent: number
  size?: number
}

export default function ScoreCircle({ percent, size = 60 }: ScoreCircleProps) {
  const clampedPercent = Math.max(0, Math.min(100, percent))
  const strokeWidth = 5
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const strokeDasharray = circumference
  const strokeDashoffset =
    circumference - (clampedPercent / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={size} height={size} className="-rotate-90 transform">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={SCORE_COLORS.GRAY}
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getScoreColor(clampedPercent)}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={strokeDasharray}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-300"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs">{Math.round(clampedPercent)}%</span>
      </div>
    </div>
  )
}

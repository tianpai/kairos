import { Circle, CircleDot, CircleDotDashed } from 'lucide-react'
import { HighlightedRequirement } from './HighlightedRequirement'
import type { ChecklistRequirement } from '@type/checklist'

interface RequirementItemProps {
  requirement: ChecklistRequirement
  selectedKeywords: Array<string>
  onToggleKeyword: (keyword: string) => void
}

export function RequirementItem({
  requirement,
  selectedKeywords,
  onToggleKeyword,
}: RequirementItemProps) {
  const isFulfilled = requirement.fulfilled
  const hasAnyFulfilledKeywords = requirement.keywords.some(
    (k) => k.isFulfilled,
  )
  const isPartiallyFulfilled = !isFulfilled && hasAnyFulfilledKeywords
  const hasWarning = requirement.reason && requirement.reason.trim() !== ''

  // Determine which icon and color to use
  const StatusIcon = isFulfilled
    ? CircleDot
    : isPartiallyFulfilled
      ? CircleDotDashed
      : Circle
  const iconColor = isFulfilled
    ? 'text-success'
    : isPartiallyFulfilled
      ? 'text-warning'
      : 'text-disabled'

  return (
    <div className="mb-2">
      <div className="flex items-start gap-2 rounded-lg bg-hover p-3">
        <StatusIcon className={`mt-0.5 h-4 w-4 shrink-0 ${iconColor}`} />
        <div className="flex-1">
          <p className="text-sm text-secondary">
            <HighlightedRequirement
              text={requirement.requirement}
              keywords={requirement.keywords}
              selectedKeywords={selectedKeywords}
              onToggleKeyword={onToggleKeyword}
            />
          </p>
          {hasWarning && (
            <p className="mt-1 text-xs text-hint">{requirement.reason}</p>
          )}
        </div>
      </div>
    </div>
  )
}

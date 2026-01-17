import { Circle, CircleDot, CircleDotDashed } from 'lucide-react'
import { HighlightedRequirement } from './HighlightedRequirement'
import type { ChecklistRequirement } from '@type/checklist'

function RequirementStatusIcon({
  isFulfilled,
  hasAnyFulfilledKeywords,
}: {
  isFulfilled: boolean
  hasAnyFulfilledKeywords: boolean
}) {
  const isPartiallyFulfilled = !isFulfilled && hasAnyFulfilledKeywords
  const Icon = isFulfilled
    ? CircleDot
    : isPartiallyFulfilled
      ? CircleDotDashed
      : Circle
  const colorClass = isFulfilled
    ? 'text-success'
    : isPartiallyFulfilled
      ? 'text-warning'
      : 'text-disabled'

  return <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${colorClass}`} />
}

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
  const hasWarning = requirement.reason && requirement.reason.trim() !== ''

  return (
    <div className="mb-2">
      <div className="flex items-start gap-2 p-2">
        <RequirementStatusIcon
          isFulfilled={isFulfilled}
          hasAnyFulfilledKeywords={hasAnyFulfilledKeywords}
        />
        <div className="flex-1">
          <p className="text-secondary text-sm">
            <HighlightedRequirement
              text={requirement.requirement}
              keywords={requirement.keywords}
              selectedKeywords={selectedKeywords}
              onToggleKeyword={onToggleKeyword}
            />
          </p>
          {hasWarning && (
            <p className="text-hint mt-1 text-xs">{requirement.reason}</p>
          )}
        </div>
      </div>
    </div>
  )
}

import { Info } from 'lucide-react'
import { HoverPopup } from '@ui/HoverPopup'
import { InfoRow } from '@ui/InfoRow'
import { getScoreColor } from '@/utils/scoreThresholds'

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

interface ApplicationInfoPopupProps {
  dueDate: string
  matchPercentage: number
  createdAt: string
  updatedAt: string
  anchorRect: DOMRect | null
  onEdit: () => void
}

export function ApplicationInfoPopup({
  dueDate,
  matchPercentage,
  createdAt,
  updatedAt,
  anchorRect,
  onEdit,
}: ApplicationInfoPopupProps): JSX.Element {
  return (
    <HoverPopup position="right" anchorRect={anchorRect} width="w-72">
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-8">
          <span className="text-hint">Score</span>
          <span
            className="font-medium"
            style={{ color: getScoreColor(matchPercentage) }}
          >
            {Math.round(matchPercentage)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-hint">Due</span>
          <span
            className={isOverdue(dueDate) ? 'text-error' : 'text-secondary'}
          >
            {formatDate(dueDate)}
          </span>
        </div>
        <InfoRow label="Created" value={formatDateTime(createdAt)} />
        <InfoRow label="Updated" value={formatDateTime(updatedAt)} />
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="bg-hover text-secondary hover:bg-active mt-2 flex w-full items-center justify-center gap-1 rounded px-2 py-1 transition-colors"
        >
          <Info size={14} />
          <span>Edit Info</span>
        </button>
      </div>
    </HoverPopup>
  )
}

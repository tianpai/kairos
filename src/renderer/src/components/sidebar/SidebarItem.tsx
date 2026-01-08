import { Info } from 'lucide-react'
import { getScoreColor } from '@/utils/scoreThresholds'

interface SidebarItemProps {
  companyName: string
  position: string
  dueDate: string
  matchPercentage: number
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
}

const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const isOverdue = (dateStr: string): boolean => {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export function SidebarItem({
  companyName,
  position,
  dueDate,
  matchPercentage,
  isSelected,
  onClick,
  onEdit,
}: SidebarItemProps) {
  return (
    <div
      className={`group relative w-full cursor-pointer px-3 py-2 text-left transition-colors ${
        isSelected ? 'bg-active' : 'hover:bg-hover'
      }`}
      onClick={onClick}
    >
      <div className="truncate text-xs font-medium text-primary">
        {companyName}
      </div>
      <div className="truncate text-[11px] text-secondary">{position}</div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1 text-[11px]">
          <span className={isOverdue(dueDate) ? 'text-error' : 'text-hint'}>
            {formatDate(dueDate)}
          </span>
          <span className="text-hint">·</span>
          <span
            className="font-medium"
            style={{ color: getScoreColor(matchPercentage) }}
          >
            {Math.round(matchPercentage)}%
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-hover"
          title="Job Info"
        >
          <Info size={14} className="text-hint" />
        </button>
      </div>
    </div>
  )
}

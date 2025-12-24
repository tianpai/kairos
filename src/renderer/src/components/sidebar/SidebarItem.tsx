import { Hammer, Info } from 'lucide-react'
import { getScoreColor } from '@/utils/scoreThresholds'

interface SidebarItemProps {
  id: string
  companyName: string
  position: string
  dueDate: string
  matchPercentage: number
  isBuiltFromScratch?: boolean
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
  isBuiltFromScratch = false,
  isSelected,
  onClick,
  onEdit,
}: SidebarItemProps) {
  return (
    <div
      className={`group relative flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition-colors ${
        isSelected
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      }`}
      onClick={onClick}
    >
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1 truncate text-sm font-medium text-gray-900 dark:text-white">
          {isBuiltFromScratch && (
            <span title="Built from scratch">
              <Hammer
                size={12}
                className="shrink-0 text-gray-400 dark:text-gray-500"
              />
            </span>
          )}
          <span className="truncate">{companyName}</span>
        </div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">
          {position}
        </div>
        <div
          className={`text-xs ${
            isOverdue(dueDate)
              ? 'text-red-500 dark:text-red-400'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {formatDate(dueDate)}
        </div>
      </div>
      <div className="ml-2 flex items-center gap-1">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEdit()
          }}
          className="rounded p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-gray-300 dark:hover:bg-gray-600"
          title="Job Info"
        >
          <Info size={14} className="text-gray-500 dark:text-gray-400" />
        </button>
        <span
          className="text-xs font-medium"
          style={{ color: getScoreColor(matchPercentage) }}
        >
          {Math.round(matchPercentage)}%
        </span>
      </div>
    </div>
  )
}

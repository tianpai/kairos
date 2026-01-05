import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface GenericSidebarItemProps {
  label: string
  sublabel?: string
  icon?: LucideIcon
  isSelected: boolean
  onClick: () => void
  rightContent?: ReactNode
  className?: string
}

export function GenericSidebarItem({
  label,
  sublabel,
  icon: Icon,
  isSelected,
  onClick,
  rightContent,
  className = '',
}: GenericSidebarItemProps) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full cursor-pointer items-center justify-between px-3 py-2 text-left transition-colors ${
        isSelected
          ? 'bg-gray-200 dark:bg-gray-700'
          : 'hover:bg-gray-100 dark:hover:bg-gray-800'
      } ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {Icon && (
          <Icon
            size={16}
            className={
              isSelected
                ? 'shrink-0 text-gray-900 dark:text-white'
                : 'shrink-0 text-gray-500 dark:text-gray-400'
            }
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-sm ${
              isSelected
                ? 'font-medium text-gray-900 dark:text-white'
                : 'text-gray-700 dark:text-gray-300'
            }`}
          >
            {label}
          </div>
          {sublabel && (
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {sublabel}
            </div>
          )}
        </div>
      </div>
      {rightContent && <div className="ml-2 shrink-0">{rightContent}</div>}
    </button>
  )
}

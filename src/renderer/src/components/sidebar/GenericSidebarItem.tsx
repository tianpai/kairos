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
        isSelected ? 'bg-active' : 'hover:bg-hover'
      } ${className}`}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {Icon && (
          <Icon
            size={16}
            className={
              isSelected ? 'shrink-0 text-primary' : 'shrink-0 text-hint'
            }
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-sm ${
              isSelected ? 'font-medium text-primary' : 'text-secondary'
            }`}
          >
            {label}
          </div>
          {sublabel && (
            <div className="truncate text-xs text-hint">{sublabel}</div>
          )}
        </div>
      </div>
      {rightContent && <div className="ml-2 shrink-0">{rightContent}</div>}
    </button>
  )
}

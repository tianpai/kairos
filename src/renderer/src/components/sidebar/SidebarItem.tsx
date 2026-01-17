import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

interface SidebarItemProps {
  label: string
  sublabel?: string
  icon?: LucideIcon
  isSelected: boolean
  onClick: () => void
  rightContent?: ReactNode
  className?: string
}

export function SidebarItem({
  label,
  sublabel,
  icon: Icon,
  isSelected,
  onClick,
  rightContent,
  className = '',
}: SidebarItemProps) {
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
              isSelected ? 'text-primary shrink-0' : 'text-hint shrink-0'
            }
          />
        )}
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-sm ${
              isSelected ? 'text-primary font-medium' : 'text-secondary'
            }`}
          >
            {label}
          </div>
          {sublabel && (
            <div className="text-hint truncate text-xs">{sublabel}</div>
          )}
        </div>
      </div>
      {rightContent && <div className="ml-2 shrink-0">{rightContent}</div>}
    </button>
  )
}

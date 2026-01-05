import type { ReactNode } from 'react'

interface CollapsibleSidebarProps {
  collapsed: boolean
  children: ReactNode
  footer?: ReactNode
  width?: string
  className?: string
}

export function CollapsibleSidebar({
  collapsed,
  children,
  footer,
  width = 'w-60',
  className = '',
}: CollapsibleSidebarProps) {
  return (
    <aside
      className={`flex h-full flex-col border-r border-gray-200 bg-[#fafafa] transition-all duration-200 ease-in-out dark:border-gray-700 dark:bg-[#2a2a2a] ${
        collapsed ? 'w-0 overflow-hidden border-r-0' : width
      } ${className}`}
    >
      {/* Inner container to prevent content reflow during animation */}
      <div className={`flex h-full ${width} flex-col`}>
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Optional footer */}
        {footer && (
          <div className="border-t border-gray-200 dark:border-gray-700">
            {footer}
          </div>
        )}
      </div>
    </aside>
  )
}

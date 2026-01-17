import type { ReactNode } from 'react'

interface SidebarProps {
  collapsed: boolean
  children: ReactNode
  footer?: ReactNode
  width?: string
  className?: string
}

export function Sidebar({
  collapsed,
  children,
  footer,
  width = 'w-48',
  className = '',
}: SidebarProps) {
  return (
    <aside
      className={`border-default bg-surface flex h-full flex-col border-r transition-all duration-200 ease-in-out ${
        collapsed ? 'w-0 overflow-hidden border-r-0' : width
      } ${className}`}
    >
      {/* Inner container to prevent content reflow during animation */}
      <div className={`flex h-full ${width} flex-col`}>
        {/* Main content area */}
        <div className="flex-1 overflow-y-auto">{children}</div>

        {/* Optional footer */}
        {footer && <div className="border-default border-t">{footer}</div>}
      </div>
    </aside>
  )
}

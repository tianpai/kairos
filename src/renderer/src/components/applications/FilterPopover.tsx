import { useEffect, useRef, useState } from 'react'
import { CircleDashed, Filter } from 'lucide-react'
import { APPLICATION_STATUSES } from './application-card/status'

interface FilterPopoverProps {
  hideOverdue: boolean
  onHideOverdueChange: (hide: boolean) => void
  statusFilter: Set<string>
  onStatusFilterChange: (statuses: Set<string>) => void
  onClear: () => void
}

export function FilterPopover({
  hideOverdue,
  onHideOverdueChange,
  statusFilter,
  onStatusFilterChange,
  onClear,
}: FilterPopoverProps) {
  const [isOpen, setIsOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  const isActive = hideOverdue || statusFilter.size > 0

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setIsOpen((prev) => !prev)
  }

  function handleStatusToggle(e: React.MouseEvent, value: string) {
    e.stopPropagation()
    const next = new Set(statusFilter)
    if (next.has(value)) {
      next.delete(value)
    } else {
      next.add(value)
    }
    onStatusFilterChange(next)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onClear()
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        aria-label="Filter applications"
        className={`relative flex items-center gap-1.5 rounded-xl border px-2.5 py-2 transition-colors ${
          isActive
            ? 'border-primary bg-hover text-primary'
            : 'border-default text-hint hover:text-primary'
        }`}
      >
        <Filter size={14} />
        {isActive && (
          <span className="bg-primary absolute -top-1 -right-1 size-2 rounded-full" />
        )}
      </button>

      {isOpen && (
        <div className="border-default bg-surface absolute right-0 top-full z-50 mt-1 flex w-48 flex-col rounded-lg border py-1 shadow-lg">
          {/* Hide overdue */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onHideOverdueChange(!hideOverdue)
            }}
            className="hover:bg-hover flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
          >
            <span
              className={`border-default flex size-3.5 items-center justify-center rounded border ${
                hideOverdue ? 'bg-primary border-primary' : ''
              }`}
            >
              {hideOverdue && (
                <svg
                  viewBox="0 0 12 12"
                  className="size-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <span className="text-secondary">Hide overdue</span>
          </button>

          <div className="border-default my-1 border-t" />

          {/* Status section header */}
          <div className="text-hint px-3 py-1 text-[10px] font-medium tracking-wide uppercase">
            Status
          </div>

          {/* Status options */}
          {APPLICATION_STATUSES.map((s) => {
            const Icon = s.icon
            const isSelected = statusFilter.has(s.value)
            return (
              <button
                key={s.value}
                onClick={(e) => handleStatusToggle(e, s.value)}
                className="hover:bg-hover flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
              >
                <span
                  className={`border-default flex size-3.5 items-center justify-center rounded border ${
                    isSelected ? 'bg-primary border-primary' : ''
                  }`}
                >
                  {isSelected && (
                    <svg
                      viewBox="0 0 12 12"
                      className="size-2.5 text-white"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <Icon size={12} className={s.color} />
                <span className={s.color}>{s.label}</span>
              </button>
            )
          })}

          {/* No status option */}
          <button
            onClick={(e) => handleStatusToggle(e, 'none')}
            className="hover:bg-hover flex items-center gap-2 px-3 py-1.5 text-xs transition-colors"
          >
            <span
              className={`border-default flex size-3.5 items-center justify-center rounded border ${
                statusFilter.has('none') ? 'bg-primary border-primary' : ''
              }`}
            >
              {statusFilter.has('none') && (
                <svg
                  viewBox="0 0 12 12"
                  className="size-2.5 text-white"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path d="M2 6l3 3 5-5" />
                </svg>
              )}
            </span>
            <CircleDashed size={12} className="text-hint" />
            <span className="text-hint">No status</span>
          </button>

          {/* Clear button */}
          {isActive && (
            <>
              <div className="border-default my-1 border-t" />
              <button
                onClick={handleClear}
                className="text-hint hover:bg-hover px-3 py-1.5 text-left text-xs transition-colors"
              >
                Clear
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

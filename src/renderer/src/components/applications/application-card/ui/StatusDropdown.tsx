import { useEffect, useRef, useState } from 'react'
import { ChevronDown, Circle, X } from 'lucide-react'
import { Button } from '@ui/Button'
import { APPLICATION_STATUSES, getStatusConfig } from '../status'

interface StatusDropdownProps {
  status: string | null
  onStatusChange: (status: string | null) => void
  iconOnly?: boolean
}

export function StatusDropdown({
  status,
  onStatusChange,
  iconOnly = false,
}: StatusDropdownProps) {
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

  const activeConfig = status ? getStatusConfig(status) : null
  const StatusIcon = activeConfig?.icon ?? Circle
  const statusColorClass = activeConfig?.color ?? 'text-hint'
  const statusLabel = activeConfig ? activeConfig.label : 'Set status'

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setIsOpen((prev) => !prev)
  }

  function handleSelect(e: React.MouseEvent, value: string) {
    e.stopPropagation()
    onStatusChange(value)
    setIsOpen(false)
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation()
    onStatusChange(null)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <Button
        onClick={handleToggle}
        ariaLabel={statusLabel}
        tooltip={statusLabel}
        variant="ghost"
        className={
          iconOnly
            ? 'border-default bg-surface hover:bg-hover flex h-8 w-8 items-center justify-center rounded-md border p-0'
            : 'border-default bg-surface hover:bg-hover flex h-8 items-center gap-1.5 rounded-md border px-2 text-xs leading-none'
        }
      >
        {iconOnly ? (
          <StatusIcon size={12} className={statusColorClass} />
        ) : (
          <>
            {activeConfig ? (
              <>
                <activeConfig.icon size={12} className={activeConfig.color} />
                <span className={activeConfig.color}>{activeConfig.label}</span>
              </>
            ) : (
              <span className="text-hint">Set status</span>
            )}
            <ChevronDown size={12} className="text-hint" />
          </>
        )}
      </Button>

      {isOpen && (
        <div className="border-default bg-surface absolute top-0 left-full z-50 ml-1 flex flex-col rounded-lg border py-1 shadow-lg">
          {APPLICATION_STATUSES.map((s) => {
            const Icon = s.icon
            const isActive = s.value === status
            return (
              <button
                key={s.value}
                onClick={(e) => handleSelect(e, s.value)}
                className={`flex items-center gap-2 px-3 py-1.5 text-xs whitespace-nowrap transition-colors ${
                  isActive ? 'bg-hover' : 'hover:bg-hover'
                }`}
              >
                <Icon size={12} className={s.color} />
                <span className={s.color}>{s.label}</span>
              </button>
            )
          })}
          {status && (
            <>
              <div className="border-default my-1 border-t" />
              <button
                onClick={handleClear}
                className="text-hint hover:bg-hover flex items-center gap-2 px-3 py-1.5 text-xs whitespace-nowrap transition-colors"
              >
                <X size={12} />
                <span>Clear</span>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}

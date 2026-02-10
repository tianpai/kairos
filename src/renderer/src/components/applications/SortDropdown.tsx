import { useEffect, useRef, useState } from 'react'
import { ArrowUpDown, Check } from 'lucide-react'

export type SortOption = 'default' | 'dueDate' | 'score'

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: 'default', label: 'Date created' },
  { value: 'dueDate', label: 'Due date' },
  { value: 'score', label: 'Score' },
]

interface SortDropdownProps {
  sortBy: SortOption
  onSortChange: (sort: SortOption) => void
}

export function SortDropdown({ sortBy, onSortChange }: SortDropdownProps) {
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

  const isActive = sortBy !== 'default'

  function handleToggle(e: React.MouseEvent) {
    e.stopPropagation()
    setIsOpen((prev) => !prev)
  }

  function handleSelect(e: React.MouseEvent, value: SortOption) {
    e.stopPropagation()
    onSortChange(value)
    setIsOpen(false)
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={handleToggle}
        aria-label="Sort applications"
        className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-2 transition-colors ${
          isActive
            ? 'border-primary bg-hover text-primary'
            : 'border-default text-hint hover:text-primary'
        }`}
      >
        <ArrowUpDown size={14} />
      </button>

      {isOpen && (
        <div className="border-default bg-surface absolute right-0 top-full z-50 mt-1 flex flex-col rounded-lg border py-1 shadow-lg">
          {SORT_OPTIONS.map((option) => {
            const isSelected = option.value === sortBy
            return (
              <button
                key={option.value}
                onClick={(e) => handleSelect(e, option.value)}
                className="hover:bg-hover flex items-center gap-2 px-3 py-1.5 text-xs whitespace-nowrap transition-colors"
              >
                <span className="w-3">
                  {isSelected && (
                    <Check size={12} className="text-primary" />
                  )}
                </span>
                <span className={isSelected ? 'text-primary' : 'text-secondary'}>
                  {option.label}
                </span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { InvertedCircleButton } from '@ui/InvertedCircleButton'
import { InvertedButton } from '@ui/InvertedButton'
import { INPUT_BASE } from './fieldStyles'

// DateInput supports flexible date formats commonly used in resumes
// Displays the date string and provides a calendar picker with granularity options

type Granularity = 'year' | 'month-year' | 'present'

interface DateInputProps {
  id: string
  value: string
  onChange: (value: string) => void
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

const NBSP = '\u00A0' // Non-breaking space for empty display

function YearPicker({ onSelect }: { onSelect: (year: number) => void }) {
  const [centerYear, setCenterYear] = useState(new Date().getFullYear())

  const years = [
    centerYear - 4,
    centerYear - 3,
    centerYear - 2,
    centerYear - 1,
    centerYear,
    centerYear + 1,
    centerYear + 2,
    centerYear + 3,
    centerYear + 4,
  ]

  return (
    <div className="bg-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <InvertedCircleButton
          onClick={() => setCenterYear((prev) => prev - 3)}
          ariaLabel="Previous years"
          bordered={false}
        >
          <ChevronLeft className="h-3 w-3" />
        </InvertedCircleButton>
        <span className="text-sm font-medium">
          {centerYear - 4}-{centerYear + 4}
        </span>
        <InvertedCircleButton
          onClick={() => setCenterYear((prev) => prev + 3)}
          ariaLabel="Next years"
          bordered={false}
        >
          <ChevronRight className="h-3 w-3" />
        </InvertedCircleButton>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {years.map((y) => (
          <button
            key={y}
            type="button"
            onClick={() => onSelect(y)}
            className="px-2 py-2 text-sm hover:bg-active"
          >
            {y}
          </button>
        ))}
      </div>
    </div>
  )
}

function MonthPicker({
  onSelect,
}: {
  onSelect: (month: number, year: number) => void
}) {
  const [displayYear, setDisplayYear] = useState(new Date().getFullYear())

  return (
    <div className="bg-surface p-3">
      <div className="mb-3 flex items-center justify-between">
        <InvertedCircleButton
          onClick={() => setDisplayYear((prev) => prev - 1)}
          ariaLabel="Previous year"
          bordered={false}
        >
          <ChevronLeft className="h-3 w-3" />
        </InvertedCircleButton>
        <span className="text-sm font-medium">
          {displayYear}
        </span>
        <InvertedCircleButton
          onClick={() => setDisplayYear((prev) => prev + 1)}
          ariaLabel="Next year"
          bordered={false}
        >
          <ChevronRight className="h-3 w-3" />
        </InvertedCircleButton>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((monthName, index) => (
          <button
            key={monthName}
            type="button"
            onClick={() => onSelect(index, displayYear)}
            className="bg-surface px-2 py-2 text-sm hover:bg-active"
          >
            {monthName}
          </button>
        ))}
      </div>
    </div>
  )
}

export function DateInput({ id, value, onChange }: DateInputProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [granularity, setGranularity] = useState<Granularity>('month-year')
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  const getGranularityButtonProps = (targetGranularity: Granularity) => ({
    bgColor:
      granularity === targetGranularity
        ? 'bg-primary'
        : 'bg-surface',
    textColor:
      granularity === targetGranularity
        ? 'text-base'
        : 'text-primary',
    className: 'flex-1 text-xs',
  })

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${INPUT_BASE} cursor-pointer text-left`}
      >
        {value || NBSP}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-64 border border-default bg-surface p-3">
          {/* Granularity Buttons */}
          <div className="mb-3 flex gap-0">
            <InvertedButton
              onClick={() => setGranularity('year')}
              {...getGranularityButtonProps('year')}
            >
              YYYY
            </InvertedButton>
            <InvertedButton
              onClick={() => setGranularity('month-year')}
              {...getGranularityButtonProps('month-year')}
            >
              MM, YYYY
            </InvertedButton>
            <InvertedButton
              onClick={() => {
                onChange('Present')
                setIsOpen(false)
              }}
              {...getGranularityButtonProps('present')}
            >
              Present
            </InvertedButton>
          </div>

          {granularity === 'year' && (
            <YearPicker
              onSelect={(year) => {
                onChange(String(year))
                setIsOpen(false)
              }}
            />
          )}
          {granularity === 'month-year' && (
            <MonthPicker
              onSelect={(month, year) => {
                onChange(`${MONTHS[month]} ${year}`)
                setIsOpen(false)
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}

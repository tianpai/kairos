import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { InvertedCircleButton } from './InvertedCircleButton'
import { INPUT_BASE, LABEL_BASE } from '@/components/resumeForm/fieldStyles'

// DatePicker displays dates in MMM DD, YYYY format (e.g., "Jan 15, 2025") by default
// and returns ISO format YYYY-MM-DD (e.g., "2025-01-15") by default
// Both display and return formats are configurable via props

type DisplayFormat = 'MMM DD, YYYY' | 'ISO' | 'MMM DD' | 'MMM, YYYY'
type ReturnFormat = 'ISO' | 'match-display'

function formatDate(dateString: string, format: DisplayFormat): string {
  if (!dateString) return ''
  const date = new Date(dateString + 'T00:00:00')

  switch (format) {
    case 'ISO':
      return dateString // Already in ISO format
    case 'MMM DD':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      })
    case 'MMM, YYYY':
      return date.toLocaleDateString('en-US', {
        month: 'short',
        year: 'numeric',
      })
    case 'MMM DD, YYYY':
    default:
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
  }
}

function formatReturnValue(
  year: number,
  month: number,
  day: number,
  displayFormat: DisplayFormat,
  returnFormat: ReturnFormat,
): string {
  const isoString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`

  if (returnFormat === 'ISO') {
    return isoString
  }

  // returnFormat === 'match-display'
  return formatDate(isoString, displayFormat)
}

interface DatePickerInputProps {
  id: string
  label: string
  value: string
  onClick: () => void
  displayFormat: DisplayFormat
}

function DatePickerInput({
  id,
  label,
  value,
  onClick,
  displayFormat,
}: DatePickerInputProps) {
  return (
    <>
      <label htmlFor={id} className={LABEL_BASE}>
        {label}
      </label>
      <button
        type="button"
        onClick={onClick}
        className={`${INPUT_BASE} text-left`}
      >
        {value ? (
          <span>{formatDate(value, displayFormat)}</span>
        ) : (
          <span className="text-hint">Select a date</span>
        )}
      </button>
    </>
  )
}

interface CalendarProps {
  selectedDate: string | null
  onDateSelect: (date: string) => void
  disablePastDates?: boolean
  displayFormat: DisplayFormat
  returnFormat: ReturnFormat
}

function Calendar({
  selectedDate,
  onDateSelect,
  disablePastDates = false,
  displayFormat,
  returnFormat,
}: CalendarProps) {
  const [displayMonth, setDisplayMonth] = useState(
    selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date(),
  )

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    return { daysInMonth, startingDayOfWeek, year, month }
  }

  const handleDateSelect = (day: number) => {
    const { year, month } = getDaysInMonth(displayMonth)
    const dateString = formatReturnValue(
      year,
      month,
      day,
      displayFormat,
      returnFormat,
    )
    onDateSelect(dateString)
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setDisplayMonth((prev) => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(newDate.getMonth() - 1)
      } else {
        newDate.setMonth(newDate.getMonth() + 1)
      }
      return newDate
    })
  }

  const { daysInMonth, startingDayOfWeek, year, month } =
    getDaysInMonth(displayMonth)

  const selected = selectedDate ? new Date(selectedDate + 'T00:00:00') : null
  const isSelectedMonth =
    selected && selected.getMonth() === month && selected.getFullYear() === year

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  return (
    <div className="absolute z-50 mt-1 w-60 border border-default bg-surface p-4">
      <div className="mb-1 flex items-center justify-between">
        <InvertedCircleButton
          onClick={() => navigateMonth('prev')}
          ariaLabel="Previous month"
          bordered={false}
        >
          <ChevronLeft className="h-3 w-3" />
        </InvertedCircleButton>
        <span>
          {displayMonth.toLocaleDateString('en-US', {
            month: 'long',
            year: 'numeric',
          })}
        </span>
        <InvertedCircleButton
          onClick={() => navigateMonth('next')}
          ariaLabel="Next month"
          bordered={false}
        >
          <ChevronRight className="h-3 w-3" />
        </InvertedCircleButton>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => (
          <div key={day} className="text-center text-xs text-secondary">
            {day}
          </div>
        ))}

        {Array.from({ length: startingDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const isSelected = isSelectedMonth && selected.getDate() === day

          const currentDate = new Date(year, month, day)
          const isPast = disablePastDates && currentDate < today

          return (
            <button
              key={day}
              type="button"
              onClick={() => handleDateSelect(day)}
              disabled={isPast}
              className={`py-0 text-center text-sm ${
                isPast
                  ? 'cursor-not-allowed text-disabled'
                  : isSelected
                    ? 'bg-primary text-base'
                    : 'text-primary hover:bg-active'
              }`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

interface DatePickerProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  disablePastDates?: boolean
  displayFormat?: DisplayFormat
  returnFormat?: ReturnFormat
}

export function DatePicker({
  id,
  label,
  value,
  onChange,
  disablePastDates = false,
  displayFormat = 'MMM DD, YYYY',
  returnFormat = 'ISO',
}: DatePickerProps) {
  const [isOpen, setIsOpen] = useState(false)
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

  const handleDateSelect = (date: string) => {
    onChange(date)
    setIsOpen(false)
  }

  return (
    <div ref={containerRef} className="relative">
      <DatePickerInput
        id={id}
        label={label}
        value={value}
        onClick={() => setIsOpen(!isOpen)}
        displayFormat={displayFormat}
      />

      {isOpen && (
        <Calendar
          selectedDate={value || null}
          onDateSelect={handleDateSelect}
          disablePastDates={disablePastDates}
          displayFormat={displayFormat}
          returnFormat={returnFormat}
        />
      )}
    </div>
  )
}

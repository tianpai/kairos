import { cn } from '@/utils/cn'

interface DiscreteSliderProps {
  values: Array<number>
  value: number
  onChange: (value: number) => void
  label?: string
  unit?: string
}

export function DiscreteSlider({
  values,
  value,
  onChange,
  label,
  unit,
}: DiscreteSliderProps): JSX.Element {
  return (
    <div className="w-full space-y-1">
      {label && (
        <label className="block text-sm font-medium">
          {label}
          {unit && <span className="text-hint"> ({unit})</span>}
        </label>
      )}
      <div className="border-default inline-flex rounded-md border">
        {values.map((v, index) => {
          const isSelected = Math.abs(v - value) < 0.0001
          const isFirst = index === 0
          const isLast = index === values.length - 1

          return (
            <button
              key={v}
              onClick={() => onChange(v)}
              className={cn(
                'px-3 py-1.5 text-sm transition-colors',
                isSelected
                  ? 'bg-active text-primary'
                  : 'bg-surface text-secondary hover:bg-hover',
                isFirst && 'rounded-l-md',
                isLast && 'rounded-r-md',
                !isLast && 'border-default border-r',
              )}
            >
              {v}
            </button>
          )
        })}
      </div>
    </div>
  )
}

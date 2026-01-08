import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

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
}: DiscreteSliderProps) {
  const buttonsRef = useRef<Map<number, HTMLButtonElement>>(new Map())
  const indicatorRef = useRef<HTMLDivElement>(null)
  const [isInitialized, setIsInitialized] = useState(false)

  useEffect(() => {
    const selectedButton = buttonsRef.current.get(value)
    if (selectedButton && indicatorRef.current) {
      const buttonRect = selectedButton.getBoundingClientRect()
      const containerRect =
        selectedButton.parentElement?.getBoundingClientRect()

      if (containerRect) {
        const leftPosition = buttonRect.left - containerRect.left

        if (!isInitialized) {
          gsap.set(indicatorRef.current, { left: leftPosition })
          setIsInitialized(true)
        } else {
          gsap.to(indicatorRef.current, {
            left: leftPosition,
            duration: 0.4,
            ease: 'power1.out',
          })
        }
      }
    }
  }, [value, isInitialized])

  return (
    <div className="w-full space-y-3">
      {label && <label className="block text-sm font-medium">{label}</label>}
      <div className="flex items-center gap-3">
        <div className="relative flex flex-1 items-center justify-between px-4">
          <div className="absolute top-1/2 right-4 left-4 h-[1px] bg-primary" />
          <div
            ref={indicatorRef}
            className="pointer-events-none absolute z-20 flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-medium text-base"
          >
            {value}
          </div>
          {values.map((v) => (
            <button
              key={v}
              ref={(el) => {
                if (el) buttonsRef.current.set(v, el)
                else buttonsRef.current.delete(v)
              }}
              onClick={() => onChange(v)}
              className="relative z-10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-surface text-sm font-medium text-primary hover:bg-active"
            >
              {Math.abs(v - value) < 0.0001 ? '' : v}
            </button>
          ))}
        </div>
        {unit && <span className="text-sm">({unit})</span>}
      </div>
    </div>
  )
}

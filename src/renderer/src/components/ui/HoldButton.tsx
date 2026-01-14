import { useCallback, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import { cn } from '@/utils/cn'

interface HoldButtonProps {
  onComplete: () => void
  holdDuration?: number
  children: ReactNode
  disabled?: boolean
  className?: string
}

export function HoldButton({
  onComplete,
  holdDuration = 1500,
  children,
  disabled = false,
  className = '',
}: HoldButtonProps) {
  const [progress, setProgress] = useState(0)
  const [isHolding, setIsHolding] = useState(false)
  const timerRef = useRef<number | null>(null)
  const startTimeRef = useRef<number | null>(null)
  const animationFrameRef = useRef<number | null>(null)

  const updateProgress = useCallback(() => {
    if (!startTimeRef.current) return

    const elapsed = Date.now() - startTimeRef.current
    const newProgress = Math.min((elapsed / holdDuration) * 100, 100)
    setProgress(newProgress)

    if (newProgress < 100) {
      animationFrameRef.current = requestAnimationFrame(updateProgress)
    }
  }, [holdDuration])

  const startHold = useCallback(() => {
    if (disabled) return

    setIsHolding(true)
    setProgress(0)
    startTimeRef.current = Date.now()

    animationFrameRef.current = requestAnimationFrame(updateProgress)

    timerRef.current = window.setTimeout(() => {
      setProgress(100)
      onComplete()
      resetHold()
    }, holdDuration)
  }, [disabled, holdDuration, onComplete, updateProgress])

  const resetHold = useCallback(() => {
    setIsHolding(false)
    setProgress(0)
    startTimeRef.current = null

    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }

    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
  }, [])

  return (
    <button
      type="button"
      disabled={disabled}
      onMouseDown={startHold}
      onMouseUp={resetHold}
      onMouseLeave={resetHold}
      onTouchStart={startHold}
      onTouchEnd={resetHold}
      className={cn(
        'relative overflow-hidden rounded-full border border-transparent px-4 py-2 text-sm font-medium select-none',
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer',
        className,
      )}
    >
      {isHolding && (
        <div
          className="bg-active absolute inset-0 transition-none"
          style={{ width: `${progress}%` }}
        />
      )}
      <span className="relative z-10">{children}</span>
    </button>
  )
}

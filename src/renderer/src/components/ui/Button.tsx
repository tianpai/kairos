import {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'motion/react'
import type { MouseEventHandler, ReactNode } from 'react'
import { cn } from '@/utils/cn'

const variantStyles = {
  default: 'text-secondary hover:text-primary px-3 py-2',
  ghost: 'text-hint hover:bg-hover hover:text-secondary p-1',
  icon: 'text-secondary hover:bg-hover p-2',
  outline:
    'border-2 border-default bg-base text-secondary hover:border-hint px-3 py-2',
  danger:
    'border-2 border-default bg-error-subtle text-error hover:bg-error-subtle/80 px-3 py-2',
} as const

type ButtonVariant = keyof typeof variantStyles

interface ButtonProps {
  onClick?: MouseEventHandler<HTMLButtonElement>
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  active?: boolean
  children: ReactNode
  className?: string
  ariaLabel?: string
  tooltip?: string
  title?: string
  variant?: ButtonVariant
}

const VIEWPORT_PADDING = 8
const TOOLTIP_OFFSET = 8
const ESTIMATED_TOOLTIP_WIDTH = 180
const ESTIMATED_TOOLTIP_HEIGHT = 36

interface TooltipSize {
  width: number
  height: number
}

interface TooltipPosition {
  top: number
  left: number
  placement: 'top' | 'bottom'
}

function getTooltipPosition(
  anchorRect: DOMRect,
  tooltipSize: TooltipSize,
): TooltipPosition {
  const tooltipWidth = tooltipSize.width || ESTIMATED_TOOLTIP_WIDTH
  const tooltipHeight = tooltipSize.height || ESTIMATED_TOOLTIP_HEIGHT

  const centeredLeft = anchorRect.left + anchorRect.width / 2 - tooltipWidth / 2
  const maxLeft = window.innerWidth - VIEWPORT_PADDING - tooltipWidth
  const left = Math.max(VIEWPORT_PADDING, Math.min(centeredLeft, maxLeft))

  const bottomTop = anchorRect.bottom + TOOLTIP_OFFSET
  const topTop = anchorRect.top - TOOLTIP_OFFSET - tooltipHeight

  const canRenderBottom =
    bottomTop + tooltipHeight <= window.innerHeight - VIEWPORT_PADDING
  const canRenderTop = topTop >= VIEWPORT_PADDING
  const placement: 'top' | 'bottom' =
    canRenderBottom || !canRenderTop ? 'bottom' : 'top'

  const unclampedTop = placement === 'bottom' ? bottomTop : topTop
  const maxTop = window.innerHeight - VIEWPORT_PADDING - tooltipHeight
  const top = Math.max(VIEWPORT_PADDING, Math.min(unclampedTop, maxTop))

  return { top, left, placement }
}

export function Button({
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  active = false,
  children,
  className = '',
  ariaLabel,
  tooltip,
  title,
  variant = 'default',
}: ButtonProps) {
  const tooltipText = (tooltip ?? title ?? '').trim()
  const hasTooltip = tooltipText.length > 0

  const wrapperRef = useRef<HTMLSpanElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const tooltipId = useId()

  const [isTooltipVisible, setIsTooltipVisible] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)
  const [tooltipSize, setTooltipSize] = useState<TooltipSize>({
    width: 0,
    height: 0,
  })

  const updateAnchorRect = useCallback(() => {
    if (!wrapperRef.current) return
    setAnchorRect(wrapperRef.current.getBoundingClientRect())
  }, [])

  const updateTooltipSize = useCallback(() => {
    if (!tooltipRef.current) return
    const rect = tooltipRef.current.getBoundingClientRect()
    setTooltipSize((previous) => {
      if (previous.width === rect.width && previous.height === rect.height) {
        return previous
      }
      return { width: rect.width, height: rect.height }
    })
  }, [])

  const showTooltip = useCallback(() => {
    if (!hasTooltip) return
    updateAnchorRect()
    setIsTooltipVisible(true)
  }, [hasTooltip, updateAnchorRect])

  const hideTooltip = useCallback(() => {
    setIsTooltipVisible(false)
  }, [])

  useLayoutEffect(() => {
    if (!isTooltipVisible) return
    updateAnchorRect()
    updateTooltipSize()
  }, [isTooltipVisible, tooltipText, updateAnchorRect, updateTooltipSize])

  useEffect(() => {
    if (!isTooltipVisible) return

    const syncPosition = () => {
      updateAnchorRect()
      updateTooltipSize()
    }

    window.addEventListener('scroll', syncPosition, true)
    window.addEventListener('resize', syncPosition)

    const observer =
      typeof ResizeObserver !== 'undefined'
        ? new ResizeObserver(syncPosition)
        : null
    if (observer && wrapperRef.current) {
      observer.observe(wrapperRef.current)
    }
    if (observer && tooltipRef.current) {
      observer.observe(tooltipRef.current)
    }

    return () => {
      window.removeEventListener('scroll', syncPosition, true)
      window.removeEventListener('resize', syncPosition)
      observer?.disconnect()
    }
  }, [isTooltipVisible, updateAnchorRect, updateTooltipSize])

  const activeStyles = active ? 'bg-active text-primary' : ''
  const tooltipPosition =
    anchorRect && isTooltipVisible
      ? getTooltipPosition(anchorRect, tooltipSize)
      : null

  return (
    <span
      ref={wrapperRef}
      className={cn(
        'relative inline-flex',
        className.includes('w-full') && 'w-full',
      )}
      onMouseEnter={hasTooltip ? showTooltip : undefined}
      onMouseLeave={hasTooltip ? hideTooltip : undefined}
      onFocus={hasTooltip ? showTooltip : undefined}
      onBlur={hasTooltip ? hideTooltip : undefined}
    >
      <button
        type={type}
        onClick={onClick}
        disabled={disabled || loading}
        aria-label={ariaLabel}
        aria-describedby={
          hasTooltip && isTooltipVisible ? tooltipId : undefined
        }
        className={`inline-flex cursor-pointer items-center justify-center rounded-md transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${activeStyles} ${className}`}
      >
        {loading ? (
          <span
            className="border-default inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
            aria-hidden="true"
          />
        ) : (
          children
        )}
      </button>

      {hasTooltip &&
        typeof document !== 'undefined' &&
        createPortal(
          <AnimatePresence>
            {tooltipPosition && (
              <motion.div
                ref={tooltipRef}
                id={tooltipId}
                role="tooltip"
                initial={{
                  opacity: 0,
                  y: tooltipPosition.placement === 'bottom' ? -4 : 4,
                  scale: 0.98,
                }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{
                  opacity: 0,
                  y: tooltipPosition.placement === 'bottom' ? -4 : 4,
                  scale: 0.98,
                }}
                transition={{ duration: 0.12, ease: 'easeOut' }}
                className="border-default bg-surface text-primary pointer-events-none fixed z-[100] max-w-[min(22rem,calc(100vw-1rem))] rounded-2xl border px-3 py-1.5 text-center text-sm leading-tight font-medium whitespace-normal shadow-lg"
                style={{
                  top: tooltipPosition.top,
                  left: tooltipPosition.left,
                }}
              >
                {tooltipText}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </span>
  )
}

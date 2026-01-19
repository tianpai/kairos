import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface TooltipProps {
  content: string
  children: ReactNode
  delay?: number
  side?: 'bottom' | 'right'
}

export function Tooltip({ content, children, delay = 0, side = 'bottom' }: TooltipProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [position, setPosition] = useState({ top: 0, left: 0 })
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const triggerRef = useRef<HTMLDivElement>(null)

  const showTooltip = () => {
    timeoutRef.current = setTimeout(() => {
      if (triggerRef.current) {
        const rect = triggerRef.current.getBoundingClientRect()
        if (side === 'right') {
          setPosition({
            top: rect.top + rect.height / 2,
            left: rect.right + 8,
          })
        } else {
          setPosition({
            top: rect.bottom + 8,
            left: rect.left + rect.width / 2,
          })
        }
      }
      setIsVisible(true)
    }, delay)
  }

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    setIsVisible(false)
  }

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  return (
    <>
      <div
        ref={triggerRef}
        className="inline-flex"
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
      >
        {children}
      </div>
      {isVisible &&
        createPortal(
          <div
            style={{ top: position.top, left: position.left }}
            className={`border-default bg-active text-primary pointer-events-none fixed z-[9999] rounded-md border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap shadow-md ${side === 'right' ? '-translate-y-1/2' : '-translate-x-1/2'}`}
          >
            {content}
          </div>,
          document.body,
        )}
    </>
  )
}

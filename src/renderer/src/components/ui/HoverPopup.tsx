import { createPortal } from 'react-dom'
import { motion } from 'motion/react'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Position = 'top' | 'bottom' | 'left' | 'right'

const positionAnimations: Record<Position, { initial: object; animate: object }> = {
  top: { initial: { opacity: 0, y: 4 }, animate: { opacity: 1, y: 0 } },
  bottom: { initial: { opacity: 0, y: -4 }, animate: { opacity: 1, y: 0 } },
  left: { initial: { opacity: 0, x: 4 }, animate: { opacity: 1, x: 0 } },
  right: { initial: { opacity: 0, x: -4 }, animate: { opacity: 1, x: 0 } },
}

interface HoverPopupProps {
  children: ReactNode
  position?: Position
  width?: string
  /** Anchor position for portal-based rendering (required for left/right) */
  anchorRect?: DOMRect | null
}

const positionClasses: Record<'top' | 'bottom', string> = {
  top: 'bottom-full left-0',
  bottom: 'top-full left-0',
}

const baseClasses = 'rounded-lg border-2 border-default bg-surface p-3'

function computePortalStyle(
  position: 'left' | 'right',
  anchorRect: DOMRect,
): CSSProperties {
  const popupHeight = 160
  const viewportHeight = window.innerHeight
  const spaceBelow = viewportHeight - anchorRect.top

  const style: CSSProperties = {
    position: 'fixed',
    zIndex: 50,
  }

  if (spaceBelow < popupHeight) {
    style.bottom = viewportHeight - anchorRect.bottom
  } else {
    style.top = anchorRect.top
  }

  if (position === 'right') {
    style.left = anchorRect.right
  } else {
    style.right = window.innerWidth - anchorRect.left
  }

  return style
}

export function HoverPopup({
  children,
  position = 'top',
  width = 'w-64',
  anchorRect,
}: HoverPopupProps): JSX.Element {
  const animation = positionAnimations[position]

  if ((position === 'left' || position === 'right') && anchorRect) {
    const style = computePortalStyle(position, anchorRect)

    return createPortal(
      <motion.div
        style={style}
        className={cn(width, baseClasses)}
        initial={animation.initial}
        animate={animation.animate}
        transition={{ duration: 0.12 }}
      >
        {children}
      </motion.div>,
      document.body,
    )
  }

  return (
    <motion.div
      className={cn(
        'absolute z-50',
        positionClasses[position as 'top' | 'bottom'],
        width,
        baseClasses,
      )}
      initial={animation.initial}
      animate={animation.animate}
      transition={{ duration: 0.12 }}
    >
      {children}
    </motion.div>
  )
}

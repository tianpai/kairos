import { createPortal } from 'react-dom'
import type { CSSProperties, ReactNode } from 'react'
import { cn } from '@/utils/cn'

type Position = 'top' | 'bottom' | 'left' | 'right'

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
  if ((position === 'left' || position === 'right') && anchorRect) {
    const style = computePortalStyle(position, anchorRect)

    return createPortal(
      <div style={style} className={cn(width, baseClasses)}>
        {children}
      </div>,
      document.body,
    )
  }

  return (
    <div
      className={cn(
        'absolute z-50',
        positionClasses[position as 'top' | 'bottom'],
        width,
        baseClasses,
      )}
    >
      {children}
    </div>
  )
}

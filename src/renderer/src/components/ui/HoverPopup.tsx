import { createPortal } from 'react-dom'
import type { ReactNode } from 'react'

interface HoverPopupProps {
  children: ReactNode
  position?: 'top' | 'bottom' | 'left' | 'right'
  width?: string
  /** Anchor position for portal-based rendering (required for left/right) */
  anchorRect?: DOMRect | null
}

const positionClasses = {
  top: 'bottom-full left-0',
  bottom: 'top-full left-0',
}

export function HoverPopup({
  children,
  position = 'top',
  width = 'w-64',
  anchorRect,
}: HoverPopupProps) {
  // For left/right positions, use portal with fixed positioning
  if ((position === 'left' || position === 'right') && anchorRect) {
    const popupHeight = 160 // Estimated popup height
    const viewportHeight = window.innerHeight
    const spaceBelow = viewportHeight - anchorRect.top

    const style: React.CSSProperties = {
      position: 'fixed',
      zIndex: 50,
    }

    // If not enough space below, align popup bottom with anchor bottom
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

    return createPortal(
      <div
        style={style}
        className={`${width} rounded-lg border-2 border-default bg-surface p-3`}
      >
        {children}
      </div>,
      document.body,
    )
  }

  // For top/bottom, use relative positioning (works within overflow containers)
  return (
    <div
      className={`absolute z-50 ${positionClasses[position as 'top' | 'bottom']} ${width} rounded-lg border-2 border-default bg-surface p-3`}
    >
      {children}
    </div>
  )
}

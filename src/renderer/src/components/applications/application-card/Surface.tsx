import { motion } from 'motion/react'
import {
  CARD_HEIGHT,
  CARD_WIDTH,
  EXPANDED_HEIGHT,
  EXPANDED_WIDTH,
} from './constants'
import type { KeyboardEvent } from 'react'

interface SurfaceProps {
  cardRef: React.RefObject<HTMLDivElement | null>
  companyName: string
  isExpanded: boolean
  isHovered: boolean
  onClick: () => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onAnimationStart: () => void
  onAnimationComplete: () => void
  onHoverStart: () => void
  onHoverEnd: () => void
  children: React.ReactNode
}

export function Surface({
  cardRef,
  companyName,
  isExpanded,
  isHovered,
  onClick,
  onKeyDown,
  onAnimationStart,
  onAnimationComplete,
  onHoverStart,
  onHoverEnd,
  children,
}: SurfaceProps) {
  const boxShadow = isExpanded
    ? '0 25px 60px -12px rgba(0,0,0,0.5)'
    : isHovered
      ? '0 15px 40px -8px rgba(0,0,0,0.3)'
      : '0 0 0 0 rgba(0,0,0,0)'

  return (
    <motion.div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${companyName} application`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={{
        width: isExpanded ? EXPANDED_WIDTH : CARD_WIDTH,
        height: isExpanded ? EXPANDED_HEIGHT : CARD_HEIGHT,
        y: isExpanded ? -(EXPANDED_HEIGHT - CARD_HEIGHT) / 2 : 0,
        x: isExpanded ? -(EXPANDED_WIDTH - CARD_WIDTH) / 2 : 0,
      }}
      whileHover={!isExpanded ? { scale: 1.03 } : {}}
      transition={{
        type: 'spring',
        damping: 20,
        stiffness: 300,
        scale: { type: 'tween', duration: 0.15 },
      }}
      className={`border-default bg-surface absolute cursor-pointer rounded-2xl border p-3 will-change-transform focus:outline-none ${isExpanded ? 'z-20' : 'z-10'}`}
      style={{
        boxShadow,
        transition: 'box-shadow 0.15s ease-out',
      }}
    >
      {children}
    </motion.div>
  )
}

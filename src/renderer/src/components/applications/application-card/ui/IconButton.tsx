import { motion } from 'motion/react'
import { fadeScale } from '../constants'

interface IconButtonProps {
  icon: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  ariaLabel: string
}

export function IconButton({ icon, onClick, ariaLabel }: IconButtonProps) {
  return (
    <motion.button
      {...fadeScale}
      onClick={onClick}
      aria-label={ariaLabel}
      className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary rounded-md border p-1.5 transition-colors"
    >
      {icon}
    </motion.button>
  )
}

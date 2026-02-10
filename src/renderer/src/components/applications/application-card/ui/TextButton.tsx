import { motion } from 'motion/react'
import { fadeScale } from '../constants'

interface TextButtonProps {
  label: string
  onClick: (e: React.MouseEvent) => void
}

export function TextButton({ label, onClick }: TextButtonProps) {
  return (
    <motion.button
      {...fadeScale}
      onClick={onClick}
      className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary rounded-lg border px-2 py-1 text-xs font-medium transition-colors"
    >
      {label}
    </motion.button>
  )
}

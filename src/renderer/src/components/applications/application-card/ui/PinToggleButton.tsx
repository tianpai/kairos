import { Pin, PinOff } from 'lucide-react'
import { motion } from 'motion/react'
import { fadeScale } from '../constants'

interface PinToggleButtonProps {
  isPinned: boolean
  onPin: (e: React.MouseEvent) => void
}

export function PinToggleButton({ isPinned, onPin }: PinToggleButtonProps) {
  return (
    <motion.button
      {...fadeScale}
      onClick={onPin}
      aria-label={isPinned ? 'Unpin application' : 'Pin application'}
      className={`absolute top-3 right-3 transition-colors ${
        isPinned
          ? 'text-primary hover:text-hint'
          : 'text-hint hover:text-primary'
      }`}
    >
      {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
    </motion.button>
  )
}

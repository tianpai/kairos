import { motion } from 'motion/react'
import { Button } from '@ui/Button'
import { fadeScale } from '../constants'

interface IconButtonProps {
  icon: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  ariaLabel: string
}

export function IconButton({ icon, onClick, ariaLabel }: IconButtonProps) {
  return (
    <motion.div {...fadeScale}>
      <Button
        onClick={onClick}
        ariaLabel={ariaLabel}
        tooltip={ariaLabel}
        variant="ghost"
        className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary flex h-8 w-8 items-center justify-center rounded-md border p-0"
      >
        {icon}
      </Button>
    </motion.div>
  )
}

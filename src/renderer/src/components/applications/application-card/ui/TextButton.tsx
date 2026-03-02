import { motion } from 'motion/react'
import { Button } from '@ui/Button'
import { fadeScale } from '../constants'

interface TextButtonProps {
  label: string
  onClick: (e: React.MouseEvent) => void
}

export function TextButton({ label, onClick }: TextButtonProps) {
  return (
    <motion.div {...fadeScale}>
      <Button
        onClick={onClick}
        ariaLabel={label}
        tooltip={label}
        variant="ghost"
        className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary inline-flex h-8 items-center justify-center rounded-md border px-2 text-xs font-medium leading-none"
      >
        {label}
      </Button>
    </motion.div>
  )
}

import { Button } from '@ui/Button'
import type { LucideIcon } from 'lucide-react'

interface IconTooltipButtonProps {
  icon: LucideIcon
  label: string
  active?: boolean
  onClick: () => void
  className?: string
}

export function IconTooltipButton({
  icon: Icon,
  label,
  active = false,
  onClick,
  className,
}: IconTooltipButtonProps) {
  return (
    <Button
      variant="icon"
      active={active}
      onClick={onClick}
      ariaLabel={label}
      tooltip={label}
      className={className}
    >
      <Icon size={16} />
    </Button>
  )
}

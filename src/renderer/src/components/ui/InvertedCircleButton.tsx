import type { ReactNode } from 'react'

interface InvertedCircleButtonProps {
  onClick: () => void
  children: ReactNode
  className?: string
  ariaLabel?: string
  variant?: 'light' | 'dark'
  bordered?: boolean
}

export function InvertedCircleButton({
  onClick,
  children,
  className = '',
  ariaLabel,
  variant = 'light',
  bordered = true,
}: InvertedCircleButtonProps) {
  const variantClasses =
    variant === 'dark'
      ? 'text-hint border-default hover:text-primary'
      : 'text-secondary border-default hover:text-primary'

  const borderClass = bordered ? 'border' : ''

  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full p-1.5 transition-colors ${borderClass} ${variantClasses} ${className}`}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  )
}

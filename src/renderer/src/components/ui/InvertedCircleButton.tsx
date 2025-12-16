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
      ? 'text-gray-400 border-gray-600 hover:text-white dark:text-gray-500 dark:border-gray-500 dark:hover:text-white'
      : 'text-gray-600 border-gray-300 hover:text-black dark:text-gray-400 dark:border-gray-600 dark:hover:text-white'

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

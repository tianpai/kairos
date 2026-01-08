import type { ReactNode } from 'react'

const variantStyles = {
  default: 'text-secondary hover:text-primary px-3 py-2',
  ghost: 'text-hint hover:bg-hover hover:text-secondary p-1',
  outline: 'border-2 border-default bg-base text-secondary hover:border-hint px-3 py-2',
  danger: 'border-2 border-default bg-error-subtle text-error hover:bg-error-subtle/80 px-3 py-2',
} as const

type ButtonVariant = keyof typeof variantStyles

interface ButtonProps {
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  children: ReactNode
  className?: string
  ariaLabel?: string
  title?: string
  variant?: ButtonVariant
}

export function Button({
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children,
  className = '',
  ariaLabel,
  title,
  variant = 'default',
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={`cursor-pointer rounded-md transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${variantStyles[variant]} ${className}`}
    >
      {loading ? (
        <span
          className="border-default inline-block h-4 w-4 animate-spin rounded-full border-2 border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </button>
  )
}

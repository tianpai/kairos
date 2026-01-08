import type { ReactNode } from 'react'

interface ButtonProps {
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  children: ReactNode
  className?: string
  ariaLabel?: string
  title?: string
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
}: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={`text-secondary hover:text-primary cursor-pointer rounded-md px-3 py-2 transition-colors duration-200 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
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

import type { ReactNode } from 'react'

interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'text'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  children: ReactNode
  className?: string
  ariaLabel?: string
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  onClick,
  type = 'button',
  children,
  className = '',
  ariaLabel,
}: ButtonProps) {
  const baseClasses =
    'inline-flex items-center justify-center transition cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-default'

  const variantClasses = {
    primary:
      'rounded-full bg-hover text-sm font-medium hover:bg-active disabled:cursor-not-allowed disabled:opacity-50',
    secondary:
      'rounded-full border border-transparent text-sm font-medium hover:bg-hover',
    text: 'text-xs font-medium underline underline-offset-4 hover:underline-offset-4',
  }

  const sizeClasses = {
    sm: variant === 'text' ? '' : 'px-4 py-2',
    md: variant === 'text' ? '' : 'px-6 py-3',
    lg: variant === 'text' ? '' : 'px-8 py-4',
  }

  const textVariantColorClasses = 'text-secondary hover:text-primary'

  const finalClasses =
    `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${
      variant === 'text' ? textVariantColorClasses : ''
    } ${className}`.trim()

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={finalClasses}
      aria-label={ariaLabel}
    >
      {loading && variant === 'primary' && (
        <span
          className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white"
          aria-hidden="true"
        />
      )}
      {loading && variant === 'primary' ? `${children}…` : children}
    </button>
  )
}

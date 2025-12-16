import type { ReactNode } from 'react'

interface InvertedButtonProps {
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
  disabled?: boolean
  loading?: boolean
  children: ReactNode
  className?: string
  ariaLabel?: string
  title?: string
  bgColor?: string
  textColor?: string
  hoverBgColor?: string
  hoverTextColor?: string
}

export function InvertedButton({
  onClick,
  type = 'button',
  disabled = false,
  loading = false,
  children,
  className = '',
  ariaLabel,
  title,
  bgColor = '',
  textColor = 'text-gray-600 dark:text-gray-400',
  hoverBgColor = '',
  hoverTextColor = 'hover:text-black dark:hover:text-white',
}: InvertedButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      title={title || ariaLabel}
      className={`cursor-pointer ${bgColor} px-3 py-2 ${textColor} transition-colors duration-200 ${hoverBgColor} ${hoverTextColor} focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
    >
      {loading ? (
        <span
          className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent"
          aria-hidden="true"
        />
      ) : (
        children
      )}
    </button>
  )
}

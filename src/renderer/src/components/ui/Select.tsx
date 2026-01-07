import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`rounded-md border border-default bg-surface px-3 py-2 pr-8 text-sm focus:border-primary focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

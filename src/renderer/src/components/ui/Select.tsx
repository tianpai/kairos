import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`border-default bg-surface focus:border-primary rounded-md border px-3 py-2 pr-8 text-sm focus:outline-none ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

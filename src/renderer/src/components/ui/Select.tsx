import type { SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode
}

export function Select({ className = '', children, ...props }: SelectProps) {
  return (
    <select
      className={`rounded-md border border-gray-300 bg-white px-3 py-2 pr-8 text-sm focus:border-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:focus:border-gray-200 ${className}`}
      {...props}
    >
      {children}
    </select>
  )
}

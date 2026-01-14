import type { ReactNode } from 'react'

export function ActionButton({
  icon,
  label,
  onClick,
}: {
  icon: ReactNode
  label: string
  onClick: () => void
}) {
  return (
    <button
      onClick={(e) => {
        e.stopPropagation()
        onClick()
      }}
      className="bg-hover text-secondary hover:bg-active mt-2 flex w-full items-center justify-center gap-1 rounded px-2 py-1 transition-colors"
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}

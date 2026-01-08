export interface CardProps {
  children?: React.ReactNode
  className?: string
  w?: string
  h?: string
  bg?: string
  interactive?: boolean
}

export default function Card({
  children,
  className = '',
  w = 'w-64',
  h = 'h-40',
  bg = 'bg-surface',
  interactive = false,
}: CardProps) {
  const interactiveStyles = interactive
    ? 'cursor-pointer shadow-[4px_4px_0_black] transition-all duration-300 hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[8px_8px_0_black] active:translate-x-0 active:translate-y-0 active:shadow-none'
    : ''

  return (
    <div
      className={`${bg} ${w} ${h} border p-4 ${interactiveStyles} ${className}`}
    >
      {children}
    </div>
  )
}

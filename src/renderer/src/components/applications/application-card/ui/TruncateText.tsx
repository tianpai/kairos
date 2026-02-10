import { MAX_TEXT_LENGTH, MAX_TEXT_LENGTH_EXPANDED } from '../constants'

interface TruncateTextProps {
  children: string
  expanded: boolean
  noWrap: boolean
  className?: string
}

export function TruncateText({
  children,
  expanded,
  noWrap,
  className,
}: TruncateTextProps) {
  const max = expanded ? MAX_TEXT_LENGTH_EXPANDED : MAX_TEXT_LENGTH
  let text = children

  if (children.length > max) {
    const half = Math.floor((max - 1) / 2)
    text = children.slice(0, half) + '…' + children.slice(-half)
  }

  return (
    <div
      className={`${className} ${noWrap ? 'overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
    >
      {text}
    </div>
  )
}

import { useRef, useState } from 'react'
import { ApplicationInfoPopup } from './ApplicationInfoPopup'
import { getScoreColor } from '@/utils/scoreThresholds'

interface SidebarItemProps {
  companyName: string
  position: string
  dueDate: string
  matchPercentage: number
  isSelected: boolean
  createdAt: string
  updatedAt: string
  onClick: () => void
  onEdit: () => void
}

export function SidebarItem({
  companyName,
  position,
  dueDate,
  matchPercentage,
  isSelected,
  createdAt,
  updatedAt,
  onClick,
  onEdit,
}: SidebarItemProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [anchorRect, setAnchorRect] = useState<DOMRect | null>(null)

  const handleMouseEnter = () => {
    setIsHovered(true)
    if (ref.current) {
      setAnchorRect(ref.current.getBoundingClientRect())
    }
  }

  const handleEdit = () => {
    setIsHovered(false)
    onEdit()
  }

  return (
    <div
      ref={ref}
      className={`group relative w-full cursor-pointer py-2 pr-3 pl-4 text-left transition-colors ${
        isSelected ? 'bg-active' : 'hover:bg-hover'
      }`}
      onClick={onClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className="absolute left-0 top-0 h-full w-0.5"
        style={{ backgroundColor: getScoreColor(matchPercentage) }}
      />
      {isHovered && (
        <ApplicationInfoPopup
          dueDate={dueDate}
          matchPercentage={matchPercentage}
          createdAt={createdAt}
          updatedAt={updatedAt}
          anchorRect={anchorRect}
          onEdit={handleEdit}
        />
      )}
      <div className="truncate text-xs font-medium text-primary">
        {companyName}
      </div>
      <div className="truncate text-[11px] text-secondary">{position}</div>
    </div>
  )
}

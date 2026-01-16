import { useRef, useState } from 'react'
import { ApplicationInfoPopup } from './ApplicationInfoPopup'
import type { Application } from './Sidebar'
import { getScoreColor } from '@/utils/scoreThresholds'

interface SidebarItemProps {
  application: Application
  isSelected: boolean
  onClick: () => void
  onEdit: () => void
}

export function SidebarItem({
  application,
  isSelected,
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
        className="absolute top-0 left-0 h-full w-0.5"
        style={{ backgroundColor: getScoreColor(application.matchPercentage) }}
      />
      {isHovered && (
        <ApplicationInfoPopup
          application={application}
          anchorRect={anchorRect}
          onEdit={handleEdit}
        />
      )}
      <div className="text-primary truncate text-xs font-medium">
        {application.companyName}
      </div>
      <div className="text-secondary truncate text-[11px]">
        {application.position}
      </div>
    </div>
  )
}

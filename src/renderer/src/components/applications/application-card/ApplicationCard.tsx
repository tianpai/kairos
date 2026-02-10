import { useRef, useState } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { normalizeUrl } from '@utils/format'
import { Content } from './Content'
import { Surface } from './Surface'
import { CARD_HEIGHT, CARD_WIDTH, fade } from './constants'
import type { JobApplication } from '@api/jobs'
import type { KeyboardEvent } from 'react'

interface ApplicationCardProps {
  application: JobApplication
  isExpanded: boolean
  isArchived: boolean
  onToggleExpand: () => void
  onOpen: (app: JobApplication, element: HTMLElement) => void
  onEdit: (app: JobApplication) => void
  onPin: (id: string) => void
  onArchive: (id: string) => void
  onStatusChange: (id: string, status: string | null) => void
  disabled?: boolean
}

export function ApplicationCard({
  application,
  isExpanded,
  isArchived,
  onToggleExpand,
  onOpen,
  onEdit,
  onPin,
  onArchive,
  onStatusChange,
  disabled,
}: ApplicationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)
  const [isAnimating, setIsAnimating] = useState(false)

  function handleBackdropClick() {
    if (isExpanded) onToggleExpand()
  }

  function handleClick() {
    if (disabled) return
    onToggleExpand()
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    onToggleExpand()
  }

  function handleOpen(e: React.MouseEvent) {
    e.stopPropagation()
    if (cardRef.current) {
      onOpen(application, cardRef.current)
    }
  }

  function handleEdit(e: React.MouseEvent) {
    e.stopPropagation()
    onEdit(application)
  }

  function handleSubmit(e: React.MouseEvent) {
    e.stopPropagation()
    if (!application.jobUrl) return
    const url = normalizeUrl(application.jobUrl)
    if (url) window.kairos.shell.openExternal(url)
  }

  function handlePin(e: React.MouseEvent) {
    e.stopPropagation()
    onPin(application.id)
  }

  function handleArchive(e: React.MouseEvent) {
    e.stopPropagation()
    onArchive(application.id)
  }

  function handleStatusChange(status: string | null) {
    onStatusChange(application.id, status)
  }

  return (
    <>
      <div
        className="relative"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        <Surface
          cardRef={cardRef}
          companyName={application.companyName}
          isExpanded={isExpanded}
          isHovered={isHovered}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
        >
          <Content
            application={application}
            isExpanded={isExpanded}
            isArchived={isArchived}
            isHovered={isHovered}
            isAnimating={isAnimating}
            onSubmit={handleSubmit}
            onEdit={handleEdit}
            onOpen={handleOpen}
            onPin={handlePin}
            onArchive={handleArchive}
            onStatusChange={handleStatusChange}
          />
        </Surface>
      </div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            {...fade}
            onClick={handleBackdropClick}
            className="fixed inset-0 z-10"
          />
        )}
      </AnimatePresence>
    </>
  )
}

import { useRef, useState } from 'react'
import { ExternalLink, Pencil } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDate, normalizeUrl } from '@utils/format'
import type { KeyboardEvent } from 'react'
import type { JobApplication } from '@api/jobs'
import { getScoreColor } from '@/utils/scoreThresholds'

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

const SPRING_POP = {
  type: 'spring' as const,
  stiffness: 500,
  damping: 25,
}

interface ApplicationCardProps {
  application: JobApplication
  onOpen: (app: JobApplication, element: HTMLElement) => void
  onEdit: (app: JobApplication) => void
  disabled?: boolean
}

export function ApplicationCard({
  application,
  onOpen,
  onEdit,
  disabled,
}: ApplicationCardProps) {
  const cardRef = useRef<HTMLDivElement>(null)
  const [isHovered, setIsHovered] = useState(false)

  function handleClick() {
    if (disabled || !cardRef.current) return
    onOpen(application, cardRef.current)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    if (cardRef.current) {
      onOpen(application, cardRef.current)
    }
  }

  function handleEditClick(e: React.MouseEvent) {
    e.stopPropagation()
    onEdit(application)
  }

  function handleExternalLink(e: React.MouseEvent) {
    e.stopPropagation()
    if (!application.jobUrl) return
    const url = normalizeUrl(application.jobUrl)
    if (url) window.kairos.shell.openExternal(url)
  }

  const scoreColor = getScoreColor(application.matchPercentage)
  const overdue = isOverdue(application.dueDate)

  return (
    <div
      className={`relative ${isHovered ? 'z-10' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <motion.div
        ref={cardRef}
        role="button"
        tabIndex={0}
        aria-label={`Open ${application.companyName} application`}
        className="border-default bg-surface relative h-28 cursor-pointer rounded-lg border text-left focus:outline-none"
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        animate={{
          scale: isHovered ? 1.08 : 1,
        }}
        transition={SPRING_POP}
        style={{
          boxShadow: isHovered
            ? '0 25px 60px -12px rgba(0,0,0,0.5)'
            : '0 0 0 0 rgba(0,0,0,0)',
          transition: 'box-shadow 0.15s ease-out',
        }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="flex h-full flex-col justify-between p-3">
          {/* Header: Company & Score */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <div className="text-primary truncate text-sm font-medium">
                {application.companyName}
              </div>
              <div className="text-secondary truncate text-xs">
                {application.position}
              </div>
            </div>
            <div
              className="shrink-0 text-xs font-semibold"
              style={{ color: scoreColor }}
            >
              {Math.round(application.matchPercentage)}%
            </div>
          </div>

          {/* Footer: Due date */}
          <div className={`text-xs ${overdue ? 'text-error' : 'text-hint'}`}>
            Due {formatDate(application.dueDate)}
          </div>
        </div>
      </motion.div>

      {/* Action buttons - outside card, slide in from right */}
      <AnimatePresence>
        {isHovered && (
          <>
            {/* Invisible bridge to prevent hover gap */}
            <div className="absolute top-0 right-0 h-full w-16 translate-x-full" />
            <motion.div
              className="absolute top-1/2 right-0 flex -translate-y-1/2 flex-col gap-1.5"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 52 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{
                type: 'spring' as const,
                stiffness: 500,
                damping: 30,
              }}
            >
              {application.jobUrl && (
                <button
                  onClick={handleExternalLink}
                  className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs shadow-lg backdrop-blur-sm transition-colors"
                  aria-label="Open job posting"
                >
                  <ExternalLink size={16} />
                </button>
              )}
              <button
                onClick={handleEditClick}
                className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary flex items-center gap-1.5 rounded-md border px-2 py-1.5 text-xs shadow-lg backdrop-blur-sm transition-colors"
                aria-label="Edit application"
              >
                <Pencil size={16} />
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}

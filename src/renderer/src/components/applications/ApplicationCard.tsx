import { useRef, useState } from 'react'
import { Dot, ExternalLink, Pencil } from 'lucide-react'
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

// Card dimensions
const CARD_WIDTH = 220
const CARD_HEIGHT = 120
const EXPANDED_WIDTH = 280
const EXPANDED_HEIGHT = 180
const MAX_TEXT_LENGTH = 22
const MAX_TEXT_LENGTH_EXPANDED = 50

function TruncateText({
  children,
  expanded,
  noWrap,
  className,
}: {
  children: string
  expanded: boolean
  noWrap: boolean
  className?: string
}) {
  const max = expanded ? MAX_TEXT_LENGTH_EXPANDED : MAX_TEXT_LENGTH
  const text =
    children.length <= max ? children : children.slice(0, max) + '...'

  return (
    <div
      className={`${className} ${noWrap ? 'overflow-hidden text-ellipsis whitespace-nowrap' : ''}`}
    >
      {text}
    </div>
  )
}

const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
}

const fadeScale = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.5 },
}

interface IconButtonProps {
  icon: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  ariaLabel: string
}

function IconButton({ icon, onClick, ariaLabel }: IconButtonProps) {
  return (
    <motion.button
      {...fadeScale}
      onClick={onClick}
      aria-label={ariaLabel}
      className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary rounded-md border p-1.5 transition-colors"
    >
      {icon}
    </motion.button>
  )
}

interface TextButtonProps {
  label: string
  onClick: (e: React.MouseEvent) => void
}

function TextButton({ label, onClick }: TextButtonProps) {
  return (
    <motion.button
      {...fadeScale}
      onClick={onClick}
      className="border-default bg-surface hover:bg-hover text-secondary hover:text-primary rounded-lg border px-2 py-1 text-xs font-medium transition-colors"
    >
      {label}
    </motion.button>
  )
}

interface ApplicationCardProps {
  application: JobApplication
  isExpanded: boolean
  onToggleExpand: () => void
  onOpen: (app: JobApplication, element: HTMLElement) => void
  onEdit: (app: JobApplication) => void
  disabled?: boolean
}

function CardScore({
  isExpanded,
  score,
}: {
  isExpanded: boolean
  score: number
}) {
  const scoreColor = getScoreColor(score)

  if (!isExpanded) {
    return (
      <motion.div
        {...fade}
        className="absolute top-1 right-1 text-sm font-semibold"
        style={{ color: scoreColor }}
      >
        <Dot className="size-10" />
      </motion.div>
    )
  }
}

export function ApplicationCard({
  application,
  isExpanded,
  onToggleExpand,
  onOpen,
  onEdit,
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

  const overdue = isOverdue(application.dueDate)

  return (
    <>
      {/* Wrapper to preserve layout space */}
      <div
        className="relative"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        <motion.div
          ref={cardRef}
          role="button"
          tabIndex={0}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${application.companyName} application`}
          onClick={handleClick}
          onKeyDown={handleKeyDown}
          onAnimationStart={() => setIsAnimating(true)}
          onAnimationComplete={() => setIsAnimating(false)}
          onHoverStart={() => setIsHovered(true)}
          onHoverEnd={() => setIsHovered(false)}
          animate={{
            width: isExpanded ? EXPANDED_WIDTH : CARD_WIDTH,
            height: isExpanded ? EXPANDED_HEIGHT : CARD_HEIGHT,
            y: isExpanded ? -(EXPANDED_HEIGHT - CARD_HEIGHT) / 2 : 0,
            x: isExpanded ? -(EXPANDED_WIDTH - CARD_WIDTH) / 2 : 0,
          }}
          whileHover={!isExpanded ? { scale: 1.03 } : {}}
          transition={{
            type: 'spring',
            damping: 20,
            stiffness: 300,
            scale: { type: 'tween', duration: 0.15 },
          }}
          className={`border-default bg-surface absolute cursor-pointer rounded-2xl border p-3 will-change-transform focus:outline-none ${isExpanded ? 'z-20' : 'z-10'}`}
          style={{
            boxShadow: isExpanded
              ? '0 25px 60px -12px rgba(0,0,0,0.5)'
              : isHovered
                ? '0 15px 40px -8px rgba(0,0,0,0.3)'
                : '0 0 0 0 rgba(0,0,0,0)',
            transition: 'box-shadow 0.15s ease-out',
          }}
        >
          <div className="text-left">
            <TruncateText
              expanded={isExpanded}
              noWrap={isAnimating}
              className="text-primary text-sm font-semibold"
            >
              {application.companyName}
            </TruncateText>
            <TruncateText
              expanded={isExpanded}
              noWrap={isAnimating}
              className="text-secondary text-xs"
            >
              {application.position}
            </TruncateText>
            <AnimatePresence>
              {isExpanded && (
                <>
                  <motion.div
                    {...fade}
                    className={`mt-1 text-xs ${overdue ? 'text-error' : 'text-hint'}`}
                  >
                    Due {formatDate(application.dueDate)}
                  </motion.div>
                  <motion.div
                    {...fade}
                    className="text-sm font-semibold"
                    style={{
                      color: getScoreColor(application.matchPercentage),
                    }}
                  >
                    {Math.round(application.matchPercentage)}%
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Due date - collapsed state */}
          <AnimatePresence>
            {!isExpanded && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.8 }}
                exit={{ opacity: 0 }}
                className={`absolute bottom-3 left-3 text-xs ${overdue ? 'text-error' : 'text-hint'}`}
              >
                Due {formatDate(application.dueDate)}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Score - shows on hover or expanded */}
          <AnimatePresence>
            <CardScore
              isExpanded={isExpanded}
              score={application.matchPercentage}
            />
          </AnimatePresence>

          {/* Action buttons - expanded state */}
          <AnimatePresence>
            {isExpanded && (
              <motion.div
                {...fade}
                className="absolute right-3 bottom-3 flex items-center gap-2"
              >
                {application.jobUrl && (
                  <IconButton
                    icon={<ExternalLink size={14} />}
                    onClick={handleSubmit}
                    ariaLabel="Open job posting"
                  />
                )}
                <IconButton
                  icon={<Pencil size={14} />}
                  onClick={handleEdit}
                  ariaLabel="Edit application"
                />
                <TextButton label="Open" onClick={handleOpen} />
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>

      {/* Backdrop */}
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

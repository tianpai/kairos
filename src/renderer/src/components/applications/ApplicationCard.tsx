import { useRef, useState } from 'react'
import { ArchiveRestore, ArchiveX, Dot, ExternalLink, Pencil, Pin, PinOff } from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDate, normalizeUrl } from '@utils/format'
import type { KeyboardEvent } from 'react'
import type { JobApplication } from '@api/jobs'
import { getScoreColor } from '@/utils/scoreThresholds'

const CARD_WIDTH = 220
const CARD_HEIGHT = 120
const EXPANDED_WIDTH = 280
const EXPANDED_HEIGHT = 180
const MAX_TEXT_LENGTH = 22
const MAX_TEXT_LENGTH_EXPANDED = 50

// --- Animation variants ---

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

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

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

function IconButton({
  icon,
  onClick,
  ariaLabel,
}: {
  icon: React.ReactNode
  onClick: (e: React.MouseEvent) => void
  ariaLabel: string
}) {
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

function TextButton({
  label,
  onClick,
}: {
  label: string
  onClick: (e: React.MouseEvent) => void
}) {
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

function PinButton({
  isPinned,
  onPin,
}: {
  isPinned: boolean
  onPin: (e: React.MouseEvent) => void
}) {
  return (
    <motion.button
      {...fadeScale}
      onClick={onPin}
      aria-label={isPinned ? 'Unpin application' : 'Pin application'}
      className={`absolute top-3 right-3 transition-colors ${
        isPinned
          ? 'text-primary hover:text-hint'
          : 'text-hint hover:text-primary'
      }`}
    >
      {isPinned ? <PinOff size={14} /> : <Pin size={14} />}
    </motion.button>
  )
}

function CollapsedContent({
  dueDate,
  matchPercentage,
  isPinned,
  isHovered,
  onPin,
}: {
  dueDate: string
  matchPercentage: number
  isPinned: boolean
  isHovered: boolean
  onPin: (e: React.MouseEvent) => void
}) {
  const overdue = isOverdue(dueDate)
  const scoreColor = getScoreColor(matchPercentage)

  return (
    <motion.div key="collapsed" {...fade}>
      {/* Top-right: pin toggle (hover only) */}
      <AnimatePresence>
        {isHovered && <PinButton isPinned={isPinned} onPin={onPin} />}
      </AnimatePresence>

      {/* Bottom-left: score dot + due date */}
      <div
        className={`-gap-1 absolute bottom-0 left-2 flex items-center text-xs ${overdue ? 'text-error' : 'text-hint'}`}
        style={{ opacity: 0.8 }}
      >
        <Dot className="-ml-2 size-8 shrink-0" style={{ color: scoreColor }} />
        Due {formatDate(dueDate)}
      </div>
    </motion.div>
  )
}

function ExpandedContent({
  application,
  isArchived,
  onSubmit,
  onEdit,
  onOpen,
  onArchive,
}: {
  application: JobApplication
  isArchived: boolean
  onSubmit: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onOpen: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
}) {
  const overdue = isOverdue(application.dueDate)

  return (
    <motion.div key="expanded" {...fade}>
      {/* Inline: due date + score */}
      <div className={`mt-1 text-xs ${overdue ? 'text-error' : 'text-hint'}`}>
        Due {formatDate(application.dueDate)}
      </div>
      <div
        className="text-sm font-semibold"
        style={{ color: getScoreColor(application.matchPercentage) }}
      >
        {Math.round(application.matchPercentage)}%
      </div>

      {/* Bottom action row */}
      <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
        {/* Left: archive / unarchive */}
        <IconButton
          icon={isArchived ? <ArchiveRestore size={14} /> : <ArchiveX size={14} />}
          onClick={onArchive}
          ariaLabel={isArchived ? 'Unarchive application' : 'Archive application'}
        />
        {/* Right: url + edit + open */}
        <div className="flex items-center gap-2">
          {application.jobUrl && (
            <IconButton
              icon={<ExternalLink size={14} />}
              onClick={onSubmit}
              ariaLabel="Open job posting"
            />
          )}
          <IconButton
            icon={<Pencil size={14} />}
            onClick={onEdit}
            ariaLabel="Edit application"
          />
          <TextButton label="Open" onClick={onOpen} />
        </div>
      </div>
    </motion.div>
  )
}

interface ApplicationCardProps {
  application: JobApplication
  isExpanded: boolean
  isArchived: boolean
  onToggleExpand: () => void
  onOpen: (app: JobApplication, element: HTMLElement) => void
  onEdit: (app: JobApplication) => void
  onPin: (id: string) => void
  onArchive: (id: string) => void
  disabled?: boolean
}

interface CardSurfaceProps {
  cardRef: React.RefObject<HTMLDivElement | null>
  companyName: string
  isExpanded: boolean
  isHovered: boolean
  onClick: () => void
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onAnimationStart: () => void
  onAnimationComplete: () => void
  onHoverStart: () => void
  onHoverEnd: () => void
  children: React.ReactNode
}

function CardSurface({
  cardRef,
  companyName,
  isExpanded,
  isHovered,
  onClick,
  onKeyDown,
  onAnimationStart,
  onAnimationComplete,
  onHoverStart,
  onHoverEnd,
  children,
}: CardSurfaceProps) {
  const boxShadow = isExpanded
    ? '0 25px 60px -12px rgba(0,0,0,0.5)'
    : isHovered
      ? '0 15px 40px -8px rgba(0,0,0,0.3)'
      : '0 0 0 0 rgba(0,0,0,0)'

  return (
    <motion.div
      ref={cardRef}
      role="button"
      tabIndex={0}
      aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${companyName} application`}
      onClick={onClick}
      onKeyDown={onKeyDown}
      onAnimationStart={onAnimationStart}
      onAnimationComplete={onAnimationComplete}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
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
        boxShadow,
        transition: 'box-shadow 0.15s ease-out',
      }}
    >
      {children}
    </motion.div>
  )
}

interface CardBodyProps {
  application: JobApplication
  isExpanded: boolean
  isArchived: boolean
  isHovered: boolean
  isAnimating: boolean
  onSubmit: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onOpen: (e: React.MouseEvent) => void
  onPin: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
}

function CardBody({
  application,
  isExpanded,
  isArchived,
  isHovered,
  isAnimating,
  onSubmit,
  onEdit,
  onOpen,
  onPin,
  onArchive,
}: CardBodyProps) {
  return (
    <>
      {/* Always visible */}
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
      </div>

      {/* State-dependent content */}
      <AnimatePresence>
        {isExpanded ? (
          <ExpandedContent
            application={application}
            isArchived={isArchived}
            onSubmit={onSubmit}
            onEdit={onEdit}
            onOpen={onOpen}
            onArchive={onArchive}
          />
        ) : (
          <CollapsedContent
            dueDate={application.dueDate}
            matchPercentage={application.matchPercentage}
            isPinned={application.pinned === 1}
            isHovered={isHovered}
            onPin={onPin}
          />
        )}
      </AnimatePresence>
    </>
  )
}

function CardBackdrop({
  isExpanded,
  onClick,
}: {
  isExpanded: boolean
  onClick: () => void
}) {
  return (
    <AnimatePresence>
      {isExpanded && (
        <motion.div
          {...fade}
          onClick={onClick}
          className="fixed inset-0 z-10"
        />
      )}
    </AnimatePresence>
  )
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

  return (
    <>
      <div
        className="relative"
        style={{ width: CARD_WIDTH, height: CARD_HEIGHT }}
      >
        <CardSurface
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
          <CardBody
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
          />
        </CardSurface>
      </div>

      <CardBackdrop isExpanded={isExpanded} onClick={handleBackdropClick} />
    </>
  )
}

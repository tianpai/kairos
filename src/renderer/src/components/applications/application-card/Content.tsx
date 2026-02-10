import {
  ArchiveRestore,
  ArchiveX,
  Dot,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import { AnimatePresence, motion } from 'motion/react'
import { formatDate } from '@utils/format'
import { fade } from './constants'
import { IconButton } from './ui/IconButton'
import { PinToggleButton } from './ui/PinToggleButton'
import { StatusBadge } from './ui/StatusBadge'
import { StatusDropdown } from './ui/StatusDropdown'
import { TextButton } from './ui/TextButton'
import { TruncateText } from './ui/TruncateText'
import { isOverdue } from './utils'
import type { JobApplication } from '@api/jobs'
import { getScoreColor } from '@/utils/scoreThresholds'

interface ContentProps {
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
  onStatusChange: (status: string | null) => void
}

interface CollapsedContentProps {
  dueDate: string
  matchPercentage: number
  applicationStatus: string | null
  isPinned: boolean
  isHovered: boolean
  onPin: (e: React.MouseEvent) => void
}

function CollapsedContent({
  dueDate,
  matchPercentage,
  applicationStatus,
  isPinned,
  isHovered,
  onPin,
}: CollapsedContentProps) {
  const overdue = isOverdue(dueDate)
  const scoreColor = getScoreColor(matchPercentage)

  return (
    <motion.div key="collapsed" {...fade}>
      <AnimatePresence>
        {isHovered && <PinToggleButton isPinned={isPinned} onPin={onPin} />}
      </AnimatePresence>

      <div
        className={`-gap-1 absolute bottom-0 left-2 flex items-center text-xs ${overdue ? 'text-error' : 'text-hint'}`}
        style={{ opacity: 0.8 }}
      >
        <Dot className="-ml-2 size-8 shrink-0" style={{ color: scoreColor }} />
        Due {formatDate(dueDate)}
      </div>

      <StatusBadge status={applicationStatus} />
    </motion.div>
  )
}

interface ExpandedContentProps {
  application: JobApplication
  isArchived: boolean
  onSubmit: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onOpen: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
  onStatusChange: (status: string | null) => void
}

function ExpandedContent({
  application,
  isArchived,
  onSubmit,
  onEdit,
  onOpen,
  onArchive,
  onStatusChange,
}: ExpandedContentProps) {
  const overdue = isOverdue(application.dueDate)

  return (
    <motion.div key="expanded" {...fade}>
      <div className={`mt-1 text-xs ${overdue ? 'text-error' : 'text-hint'}`}>
        Due {formatDate(application.dueDate)}
      </div>
      <div className="flex items-center gap-2">
        <div
          className="text-sm font-semibold"
          style={{ color: getScoreColor(application.matchPercentage) }}
        >
          {Math.round(application.matchPercentage)}%
        </div>
        <StatusDropdown
          status={application.applicationStatus}
          onStatusChange={onStatusChange}
        />
      </div>

      <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
        <IconButton
          icon={
            isArchived ? <ArchiveRestore size={14} /> : <ArchiveX size={14} />
          }
          onClick={onArchive}
          ariaLabel={
            isArchived ? 'Unarchive application' : 'Archive application'
          }
        />
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

export function Content({
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
  onStatusChange,
}: ContentProps) {
  return (
    <>
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

      <AnimatePresence>
        {isExpanded ? (
          <ExpandedContent
            application={application}
            isArchived={isArchived}
            onSubmit={onSubmit}
            onEdit={onEdit}
            onOpen={onOpen}
            onArchive={onArchive}
            onStatusChange={onStatusChange}
          />
        ) : (
          <CollapsedContent
            dueDate={application.dueDate}
            matchPercentage={application.matchPercentage}
            applicationStatus={application.applicationStatus}
            isPinned={application.pinned === 1}
            isHovered={isHovered}
            onPin={onPin}
          />
        )}
      </AnimatePresence>
    </>
  )
}

import {
  ArchiveRestore,
  ArchiveX,
  Dot,
  ExternalLink,
  Loader2,
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
import { useWorkflowRuntimeStore } from '@/hooks/workflowRuntime.store'

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
  isWorkflowRunning: boolean
  onPin: (e: React.MouseEvent) => void
}

function CollapsedContent({
  dueDate,
  matchPercentage,
  applicationStatus,
  isPinned,
  isHovered,
  isWorkflowRunning,
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
        {isWorkflowRunning ? (
          <Loader2 className="text-hint mr-1 -ml-0.5 size-3.5 shrink-0 animate-spin" />
        ) : (
          <Dot
            className="-ml-2 size-8 shrink-0"
            style={{ color: scoreColor }}
          />
        )}
        Due {formatDate(dueDate)}
      </div>

      <StatusBadge status={applicationStatus} />
    </motion.div>
  )
}

interface ExpandedContentProps {
  application: JobApplication
  isArchived: boolean
  isWorkflowRunning: boolean
  onSubmit: (e: React.MouseEvent) => void
  onEdit: (e: React.MouseEvent) => void
  onOpen: (e: React.MouseEvent) => void
  onArchive: (e: React.MouseEvent) => void
  onStatusChange: (status: string | null) => void
}

function ExpandedContent({
  application,
  isArchived,
  isWorkflowRunning,
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
      {isWorkflowRunning ? (
        <div className="mt-0.5 flex items-center gap-1.5 text-sm">
          <Loader2 className="text-hint size-3.5 animate-spin" />
        </div>
      ) : (
        <div
          className="mt-0.5 text-sm font-semibold"
          style={{ color: getScoreColor(application.matchPercentage) }}
        >
          {Math.round(application.matchPercentage)}%
        </div>
      )}

      <div className="absolute right-3 bottom-3 left-3 flex items-center justify-between">
        <div className="flex items-center gap-1">
          <IconButton
            icon={
              isArchived ? <ArchiveRestore size={14} /> : <ArchiveX size={14} />
            }
            onClick={onArchive}
            ariaLabel={
              isArchived ? 'Unarchive application' : 'Archive application'
            }
          />
          <StatusDropdown
            status={application.applicationStatus}
            onStatusChange={onStatusChange}
            iconOnly
          />
        </div>
        <div className="flex items-center gap-1.5">
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
  const workflow = useWorkflowRuntimeStore(
    (state) => state.workflowsByJobId[application.id],
  )
  const isWorkflowRunning = workflow
    ? Object.values(workflow.tasks).some((t) => t.status === 'running')
    : false

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
            isWorkflowRunning={isWorkflowRunning}
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
            isWorkflowRunning={isWorkflowRunning}
            onPin={onPin}
          />
        )}
      </AnimatePresence>
    </>
  )
}

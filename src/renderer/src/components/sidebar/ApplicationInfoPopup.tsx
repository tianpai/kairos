import { ExternalLink, Info } from 'lucide-react'
import { HoverPopup } from '@ui/HoverPopup'
import { InfoRow } from '@ui/InfoRow'
import { formatDate, formatDateTime, normalizeUrl } from '@utils/format'
import { ActionButton } from './PopupButton'
import type { Application } from './Sidebar'
import { getScoreColor } from '@/utils/scoreThresholds'

function isOverdue(dateStr: string): boolean {
  const date = new Date(dateStr)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

interface ApplicationInfoPopupProps {
  application: Application
  anchorRect: DOMRect | null
  onEdit: () => void
}

export function ApplicationInfoPopup({
  application,
  anchorRect,
  onEdit,
}: ApplicationInfoPopupProps) {
  const jobUrl = application.jobUrl

  return (
    <HoverPopup position="right" anchorRect={anchorRect} width="w-72">
      <div className="space-y-1 text-sm">
        <div className="flex items-center justify-between gap-8">
          <span className="text-hint">Score</span>
          <span
            className="font-medium"
            style={{ color: getScoreColor(application.matchPercentage) }}
          >
            {Math.round(application.matchPercentage)}%
          </span>
        </div>
        <div className="flex items-center justify-between gap-8">
          <span className="text-hint">Due</span>
          <span
            className={
              isOverdue(application.dueDate) ? 'text-error' : 'text-secondary'
            }
          >
            {formatDate(application.dueDate)}
          </span>
        </div>
        <InfoRow
          label="Created"
          value={formatDateTime(application.createdAt)}
        />
        <InfoRow
          label="Updated"
          value={formatDateTime(application.updatedAt)}
        />
        {jobUrl && (
          <ActionButton
            icon={<ExternalLink size={14} />}
            label="Submission Site"
            onClick={() => {
              const url = normalizeUrl(jobUrl)
              if (url) window.kairos.shell.openExternal(url)
            }}
          />
        )}
        <ActionButton
          icon={<Info size={14} />}
          label="Edit Info"
          onClick={onEdit}
        />
      </div>
    </HoverPopup>
  )
}

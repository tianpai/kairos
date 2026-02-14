import {
  CheckCircle,
  Gift,
  MessageSquare,
  Send,
  XCircle,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type ApplicationStatus =
  | 'submitted'
  | 'interviewed'
  | 'offered'
  | 'rejected'
  | 'accepted'

export interface StatusConfig {
  value: ApplicationStatus
  label: string
  icon: LucideIcon
  color: string
}

export const APPLICATION_STATUSES: Array<StatusConfig> = [
  { value: 'submitted', label: 'Submitted', icon: Send, color: 'text-info' },
  { value: 'interviewed', label: 'Interviewed', icon: MessageSquare, color: 'text-warning' },
  { value: 'offered', label: 'Offered', icon: Gift, color: 'text-success' },
  { value: 'rejected', label: 'Rejected', icon: XCircle, color: 'text-error' },
  { value: 'accepted', label: 'Accepted', icon: CheckCircle, color: 'text-[#22c55e]' },
]

export function getStatusConfig(status: string): StatusConfig | undefined {
  return APPLICATION_STATUSES.find((s) => s.value === status)
}

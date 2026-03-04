import { motion } from 'motion/react'
import { fade } from '../constants'
import { getStatusConfig } from '../status'

interface StatusBadgeProps {
  status: string | null
}

export function StatusBadge({ status }: StatusBadgeProps) {
  if (!status) return null

  const config = getStatusConfig(status)
  if (!config) return null

  const Icon = config.icon

  return (
    <motion.div
      {...fade}
      className={`absolute right-2 bottom-2 ${config.color}`}
      style={{ opacity: 0.8 }}
      aria-label={config.label}
    >
      <Icon size={12} />
    </motion.div>
  )
}

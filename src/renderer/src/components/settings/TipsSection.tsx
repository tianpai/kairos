import { InvertedButton } from '@ui/InvertedButton'
import { tips } from '@tips/tips.data'
import { useTipsStore } from '@tips/tips.store'

export function TipsSection() {
  const { neverShowAgain, dismissedAt, cooldownMs, reset } = useTipsStore()

  const getTipStatus = (tipId: string): 'hidden' | 'dismissed' | null => {
    if (neverShowAgain.includes(tipId)) {
      return 'hidden'
    }
    const dismissedTime = dismissedAt[tipId]
    if (dismissedTime && Date.now() - dismissedTime < cooldownMs) {
      return 'dismissed'
    }
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tips</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Manage app tips and hints.
        </p>
      </div>

      <div className="space-y-2">
        {tips.map((tip) => {
          const status = getTipStatus(tip.id)
          return (
            <div
              key={tip.id}
              className="flex items-start justify-between gap-4 border-b border-gray-100 py-2 last:border-0 dark:border-gray-800"
            >
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {tip.message}
              </p>
              {status && (
                <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">
                  {status === 'hidden' ? 'Hidden' : 'Dismissed'}
                </span>
              )}
            </div>
          )
        })}
      </div>

      <InvertedButton onClick={reset}>Reset All Tips</InvertedButton>
    </div>
  )
}

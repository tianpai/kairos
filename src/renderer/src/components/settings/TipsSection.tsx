import { useEffect, useRef, useState } from 'react'
import { Button } from '@ui/Button'
import { getTipsByCategory } from '@tips/tips.data'
import { CATEGORY_LABELS } from '@tips/tips.types'
import { useTipsStore } from '@tips/tips.store'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@ui/Accordion'

function formatCooldown(remainingMs: number): string {
  const days = Math.floor(remainingMs / (24 * 60 * 60 * 1000))
  const hours = Math.floor(
    (remainingMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000),
  )
  const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000))

  if (days > 0) return `${days}d ${hours}h`
  if (hours > 0) return `${hours}h ${minutes}m`
  return `${minutes}m`
}

export function TipsSection() {
  const { neverShowAgain, dismissedAt, cooldownMs, reset, shownCount } =
    useTipsStore()

  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const [key, setKey] = useState(0)
  const currentTimeRef = useRef<number>(Date.now())

  useEffect(() => {
    const interval = setInterval(() => {
      currentTimeRef.current = Date.now()
      const hasActiveCooldown = Object.keys(dismissedAt).some((tipId) => {
        const dismissedTime = dismissedAt[tipId]
        const elapsed = currentTimeRef.current - dismissedTime
        const remaining = cooldownMs - elapsed
        return remaining > 0 && remaining < 1000
      })

      if (hasActiveCooldown) {
        setKey((k) => k + 1)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [dismissedAt, cooldownMs])

  const handleReset = () => {
    reset()
    setKey((k) => k + 1)
  }

  const handleToggleTip = (tipId: string, enable: boolean) => {
    const store = useTipsStore.getState()
    if (enable) {
      store.neverShowAgain = store.neverShowAgain.filter((id) => id !== tipId)
      store.dismissedAt = { ...store.dismissedAt, [tipId]: 0 }
    } else {
      store.neverShowAgain = [...store.neverShowAgain, tipId]
    }
    setKey((k) => k + 1)
  }

  const getTipStatus = (tipId: string): 'hidden' | 'dismissed' | 'active' => {
    if (neverShowAgain.includes(tipId)) return 'hidden'
    const dismissedTime = dismissedAt[tipId]
    if (dismissedTime && Date.now() - dismissedTime < cooldownMs) {
      return 'dismissed'
    }
    return 'active'
  }

  const getCooldownRemaining = (tipId: string): number => {
    const dismissedTime = dismissedAt[tipId]
    if (!dismissedTime) return 0
    const elapsed = currentTimeRef.current - dismissedTime
    const remaining = cooldownMs - elapsed
    return Math.max(0, remaining)
  }

  const filteredTips = getTipsByCategory(selectedCategory)
  const categories = ['all', ...Object.keys(CATEGORY_LABELS)]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Tips</h2>
        <p className="text-hint mt-1 text-sm">Manage app tips and hints.</p>
      </div>

      <div className="flex items-center gap-4">
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="border-default bg-background text-secondary rounded border px-3 py-1.5 text-sm"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat === 'all'
                ? 'All Categories'
                : CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS]?.label}
            </option>
          ))}
        </select>
      </div>

      <Accordion
        defaultValue={''}
        className="max-h-[calc(100vh-26rem)] overflow-y-auto"
      >
        {filteredTips.map((tipItem) => {
          const status = getTipStatus(tipItem.id)
          const cooldownRemaining = getCooldownRemaining(tipItem.id)

          return (
            <AccordionItem
              key={`${tipItem.id}-${key}`}
              value={tipItem.id}
              className="border-default border-b last:border-b-0"
            >
              <AccordionTrigger value={tipItem.id} className="py-3">
                <div className="flex w-full gap-2">
                  <span className="text-secondary text-sm">
                    {tipItem.message}
                  </span>
                  {status !== 'active' && (
                    <span
                      className={`shrink-0 rounded px-2 py-0.5 text-xs font-medium ${
                        status === 'hidden'
                          ? 'bg-hover text-hint'
                          : 'bg-warning/10 text-warning'
                      }`}
                    >
                      {status === 'hidden' ? 'Hidden' : 'Dismissed'}
                    </span>
                  )}
                  {status === 'dismissed' && cooldownRemaining > 0 && (
                    <span className="text-hint shrink-0 text-xs">
                      {formatCooldown(cooldownRemaining)}
                    </span>
                  )}
                </div>
              </AccordionTrigger>
              <AccordionContent value={tipItem.id} className="pb-3">
                <div className="space-y-3">
                  <div>
                    <div className="mt-2 flex items-center gap-2">
                      <span
                        className={`rounded px-2 py-0.5 text-xs font-medium ${
                          status === 'hidden'
                            ? 'bg-hover text-hint'
                            : status === 'dismissed'
                              ? 'bg-warning/10 text-warning'
                              : 'bg-success/10 text-success'
                        }`}
                      >
                        {status === 'active'
                          ? 'Active'
                          : status === 'hidden'
                            ? 'Hidden'
                            : 'Dismissed'}
                      </span>
                      <span className="text-hint text-xs">
                        Shown {shownCount[tipItem.id] || 0} times
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {status === 'active' ? (
                      <Button
                        onClick={() => handleToggleTip(tipItem.id, false)}
                        variant="outline"
                      >
                        Never show
                      </Button>
                    ) : (
                      <Button
                        onClick={() => handleToggleTip(tipItem.id, true)}
                        variant="outline"
                      >
                        Show again
                      </Button>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )
        })}
      </Accordion>

      <Button onClick={handleReset}>Reset All Tips</Button>
    </div>
  )
}

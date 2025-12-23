import { X } from 'lucide-react'
import { useTipsStore } from './tips.store'

export function TipBanner() {
  const activeTip = useTipsStore((state) => state.activeTip)
  const dismiss = useTipsStore((state) => state.dismiss)
  const neverShow = useTipsStore((state) => state.neverShow)

  const isVisible = activeTip !== null

  return (
    <div
      className={`fixed right-0 bottom-0 left-0 z-50 transition-transform duration-300 ease-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
      {/* Banner content */}
      <div className="flex h-8 items-center justify-between bg-black px-4 text-sm text-gray-300">
        <div className="flex-1 truncate">{activeTip?.message}</div>

        <div className="flex items-center gap-3">
          <button
            onClick={neverShow}
            className="text-xs text-gray-400 transition-colors hover:text-gray-200"
          >
            Don't show again
          </button>

          <button
            onClick={dismiss}
            className="rounded p-0.5 text-gray-400 transition-colors hover:text-gray-100"
            aria-label="Dismiss tip"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  )
}

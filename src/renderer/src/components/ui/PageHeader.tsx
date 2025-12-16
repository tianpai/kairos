import type { ReactNode } from 'react'

interface PageHeaderProps {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  backgroundColor?: string
}

export function PageHeader({
  left,
  center,
  right,
}: PageHeaderProps) {
  return (
    <header
      className="relative z-20 grid h-12 grid-cols-3 items-center border-b border-gray-200 bg-app-header dark:border-gray-700"
      style={{
        // @ts-expect-error app-region is a valid CSS property in Electron
        appRegion: 'drag',
        WebkitAppRegion: 'drag',
      }}
    >
      {/* Left section: 80px padding for macOS traffic lights, no-drag for buttons */}
      <div
        className="flex items-center justify-self-start pl-20"
        style={{
          // @ts-expect-error app-region is a valid CSS property in Electron
          appRegion: 'no-drag',
          WebkitAppRegion: 'no-drag',
        }}
      >
        {left}
      </div>
      <div className="justify-self-center overflow-hidden text-center">
        <div className="truncate">{center}</div>
      </div>
      {/* Right section: buttons need to be clickable (no-drag) */}
      <div
        className="flex items-center justify-self-end pr-4"
        style={{
          // @ts-expect-error app-region is a valid CSS property in Electron
          appRegion: 'no-drag',
          WebkitAppRegion: 'no-drag',
        }}
      >
        {right}
      </div>
    </header>
  )
}

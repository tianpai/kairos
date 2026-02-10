import type { ReactNode } from 'react'

interface PageHeaderProps {
  left?: ReactNode
  center?: ReactNode
  right?: ReactNode
  backgroundColor?: string
}

export function PageHeader({ left, center, right }: PageHeaderProps) {
  return (
    <header
      className="bg-surface border-default relative z-20 grid h-12 grid-cols-3 items-center border-b"
      style={{
        // @ts-expect-error app-region is a valid CSS property in Electron
        appRegion: 'drag',
        WebkitAppRegion: 'drag',
      }}
    >
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
        <div className="truncate text-sm font-medium">{center}</div>
      </div>
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

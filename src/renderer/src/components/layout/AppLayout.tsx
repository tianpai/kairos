interface AppLayoutProps {
  header: React.ReactNode
  sidebar: React.ReactNode
  children: React.ReactNode
}

export function AppLayout({ header, sidebar, children }: AppLayoutProps) {
  return (
    <div className="bg-app-bg flex h-screen flex-col">
      {header}
      <div className="flex flex-1 overflow-hidden">
        {sidebar}
        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  )
}

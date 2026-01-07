interface EmptyStateProps {
  hasApplications: boolean
}

export function EmptyState({ hasApplications }: EmptyStateProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <p className="text-hint">
          {hasApplications
            ? 'Select an application from the sidebar'
            : 'No applications yet. Create your first application to get started.'}
        </p>
      </div>
    </div>
  )
}

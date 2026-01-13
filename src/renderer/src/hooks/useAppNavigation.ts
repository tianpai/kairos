import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShortcutStore } from '@layout/shortcut.store'
import type { JobApplication } from '@api/jobs'

/**
 * Handles keyboard shortcut navigation between job applications
 *
 * Responds to shortcut store navigation requests by finding the target
 * application and updating the URL via TanStack Router.
 *
 * @param applications - Array of job applications, ordered newest-first (most recent at index 0)
 * @param currentJobId - ID of the currently selected job application
 */
export function useAppNavigation(
  applications: Array<JobApplication>,
  currentJobId?: string,
) {
  const navigate = useNavigate()

  const navigationRequested = useShortcutStore(
    (state) => state.navigationRequested,
  )
  const clearNavigationRequest = useShortcutStore(
    (state) => state.clearNavigationRequest,
  )

  useEffect(() => {
    if (!navigationRequested || applications.length === 0) {
      if (navigationRequested) {
        clearNavigationRequest()
      }
      return
    }

    const currentIndex = applications.findIndex(
      (app) => app.id === currentJobId,
    )
    let targetId: string | undefined

    switch (navigationRequested) {
      case 'prev':
        targetId = applications[Math.max(0, currentIndex - 1)]?.id
        break
      case 'next':
        targetId =
          applications[Math.min(applications.length - 1, currentIndex + 1)]?.id
        break
      case 'oldest':
        targetId = applications[applications.length - 1]?.id
        break
      case 'latest':
        targetId = applications[0]?.id
        break
      default:
        return
    }

    if (targetId && targetId !== currentJobId) {
      navigate({ to: '/', search: { jobId: targetId } })
    }

    clearNavigationRequest()
  }, [
    navigationRequested,
    applications,
    currentJobId,
    navigate,
    clearNavigationRequest,
  ])
}

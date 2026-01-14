import { useCallback, useEffect, useRef } from 'react'
import { useNavigate } from '@tanstack/react-router'
import type { JobApplicationListItem } from '@shared/types'
import {
  clearLastViewedApplicationId,
  getLastViewedApplicationId,
  setLastViewedApplicationId,
} from '@/utils/lastViewedApplication'

interface UseLastViewedApplicationOptions {
  jobId: string | undefined
  applications: Array<JobApplicationListItem>
}

export function useLastViewedApplication({
  jobId,
  applications,
}: UseLastViewedApplicationOptions) {
  const navigate = useNavigate()
  const hasRestoredRef = useRef(false)

  // Save last viewed application to localStorage
  useEffect(
    function saveLastViewed() {
      if (jobId) {
        setLastViewedApplicationId(jobId)
      }
    },
    [jobId],
  )

  // Restore last viewed application on startup
  useEffect(
    function restoreLastViewed() {
      if (hasRestoredRef.current) return
      if (jobId) return
      if (applications.length === 0) return

      hasRestoredRef.current = true

      const lastViewedId = getLastViewedApplicationId()
      if (!lastViewedId) return

      const exists = applications.some(function (app) {
        return app.id === lastViewedId
      })
      if (exists) {
        navigate({ to: '/', search: { jobId: lastViewedId } })
      } else {
        clearLastViewedApplicationId()
      }
    },
    [jobId, applications, navigate],
  )

  const selectApplication = useCallback(
    function selectApplication(id: string) {
      navigate({ to: '/', search: { jobId: id } })
    },
    [navigate],
  )

  const navigateAfterDelete = useCallback(
    function navigateAfterDelete(deletedId: string) {
      if (deletedId !== jobId) return

      // Find next application (applications are sorted by createdAt desc)
      const remaining = applications.filter(function (app) {
        return app.id !== deletedId
      })

      if (remaining.length > 0) {
        navigate({ to: '/', search: { jobId: remaining[0].id } })
      } else {
        clearLastViewedApplicationId()
        navigate({ to: '/', search: { jobId: undefined } })
      }
    },
    [jobId, applications, navigate],
  )

  return {
    selectApplication,
    navigateAfterDelete,
  }
}

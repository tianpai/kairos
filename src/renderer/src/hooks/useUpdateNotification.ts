import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'

export function useUpdateNotification() {
  const navigate = useNavigate()

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const isPackaged = await window.kairos.updater.isPackaged()
        if (!isPackaged) return

        const state = await window.kairos.updater.check()
        if (state.status === 'available' && state.version) {
          toast.info(`Update available: v${state.version}`, {
            action: {
              label: 'View',
              onClick: () =>
                navigate({
                  to: '/settings',
                  search: {
                    section: 'about',
                    update: 'available',
                    version: state.version,
                  },
                }),
            },
            duration: 10000,
          })
        }
      } catch {
        // Silently ignore update check failures on startup
      }
    }

    checkForUpdate()
  }, [navigate])
}

import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import { checkForUpdates, isUpdaterPackaged } from '@api/updater'

export function useUpdateNotification() {
  const navigate = useNavigate()

  useEffect(() => {
    const checkForUpdate = async () => {
      try {
        const isPackaged = await isUpdaterPackaged()
        if (!isPackaged) return

        const state = await checkForUpdates()
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

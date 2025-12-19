import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShortcutStore } from '@/components/layout/shortcut.store'

export function useShortcutListener() {
  const navigate = useNavigate()
  const requestNewApplication = useShortcutStore(
    (state) => state.requestNewApplication,
  )
  const requestBuildFromScratch = useShortcutStore(
    (state) => state.requestBuildFromScratch,
  )

  useEffect(() => {
    const unsubSettings = window.electron.shortcuts.onSettings(() => {
      navigate({ to: '/settings' })
    })

    const unsubNewApp = window.electron.shortcuts.onNewApplication(() => {
      requestNewApplication()
    })

    const unsubBuild = window.electron.shortcuts.onBuildFromScratch(() => {
      requestBuildFromScratch()
    })

    return () => {
      unsubSettings()
      unsubNewApp()
      unsubBuild()
    }
  }, [navigate, requestNewApplication, requestBuildFromScratch])
}

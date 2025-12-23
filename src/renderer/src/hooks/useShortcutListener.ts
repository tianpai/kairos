import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShortcutStore } from '@/components/layout/shortcut.store'

export function useShortcutListener() {
  const navigate = useNavigate()
  const requestNewApplication = useShortcutStore(
    (state) => state.requestNewApplication,
  )

  useEffect(() => {
    const unsubSettings = window.electron.shortcuts.onSettings(() => {
      navigate({ to: '/settings' })
    })

    const unsubNewApp = window.electron.shortcuts.onNewApplication(() => {
      requestNewApplication()
    })

    return () => {
      unsubSettings()
      unsubNewApp()
    }
  }, [navigate, requestNewApplication])
}

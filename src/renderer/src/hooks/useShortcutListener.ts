import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShortcutStore } from '@/components/layout/shortcut.store'
import { useLayoutStore } from '@/components/layout/layout.store'

export function useShortcutListener() {
  const navigate = useNavigate()

  // Get store actions
  const requestNewApplication = useShortcutStore(
    (state) => state.requestNewApplication,
  )
  const requestSave = useShortcutStore((state) => state.requestSave)
  const requestExportPdf = useShortcutStore((state) => state.requestExportPdf)
  const requestDocumentSettings = useShortcutStore(
    (state) => state.requestDocumentSettings,
  )
  const requestTailor = useShortcutStore((state) => state.requestTailor)
  const requestNavigation = useShortcutStore(
    (state) => state.requestNavigation,
  )

  useEffect(() => {
    // Settings - direct navigation
    const unsubSettings = window.electron.shortcuts.onSettings(() => {
      navigate({ to: '/settings' })
    })

    // New Application - store flag
    const unsubNewApp = window.electron.shortcuts.onNewApplication(() => {
      requestNewApplication()
    })

    // Save - store flag
    const unsubSave = window.electron.shortcuts.onSave(() => {
      requestSave()
    })

    // Export PDF - store flag
    const unsubExportPdf = window.electron.shortcuts.onExportPdf(() => {
      requestExportPdf()
    })

    // Document Settings - store flag
    const unsubDocSettings = window.electron.shortcuts.onDocumentSettings(
      () => {
        requestDocumentSettings()
      },
    )

    // Tailor - store flag
    const unsubTailor = window.electron.shortcuts.onTailor(() => {
      requestTailor()
    })

    // Navigation - store flags with direction
    const unsubPrevApp = window.electron.shortcuts.onPrevApp(() => {
      requestNavigation('prev')
    })

    const unsubNextApp = window.electron.shortcuts.onNextApp(() => {
      requestNavigation('next')
    })

    const unsubLatestApp = window.electron.shortcuts.onLatestApp(() => {
      requestNavigation('latest')
    })

    const unsubOldestApp = window.electron.shortcuts.onOldestApp(() => {
      requestNavigation('oldest')
    })

    // Toggle Sidebar - direct store call
    const unsubToggleSidebar = window.electron.shortcuts.onToggleSidebar(
      () => {
        useLayoutStore.getState().toggleSidebar()
      },
    )

    // Toggle Columns - direct store call
    const unsubToggleColumns = window.electron.shortcuts.onToggleColumns(
      () => {
        useLayoutStore.getState().toggleChecklist()
      },
    )

    return () => {
      unsubSettings()
      unsubNewApp()
      unsubSave()
      unsubExportPdf()
      unsubDocSettings()
      unsubTailor()
      unsubPrevApp()
      unsubNextApp()
      unsubLatestApp()
      unsubOldestApp()
      unsubToggleSidebar()
      unsubToggleColumns()
    }
  }, [
    navigate,
    requestNewApplication,
    requestSave,
    requestExportPdf,
    requestDocumentSettings,
    requestTailor,
    requestNavigation,
  ])
}

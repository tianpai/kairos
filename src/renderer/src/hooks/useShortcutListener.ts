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
  const requestBatchExport = useShortcutStore(
    (state) => state.requestBatchExport,
  )
  const requestDocumentSettings = useShortcutStore(
    (state) => state.requestDocumentSettings,
  )
  const requestTailor = useShortcutStore((state) => state.requestTailor)
  const requestNavigation = useShortcutStore((state) => state.requestNavigation)

  useEffect(() => {
    // Settings - direct navigation
    const unsubSettings = window.kairos.shortcuts.onSettings(() => {
      navigate({ to: '/settings' })
    })

    // New Application - store flag
    const unsubNewApp = window.kairos.shortcuts.onNewApplication(() => {
      requestNewApplication()
    })

    // Save - store flag
    const unsubSave = window.kairos.shortcuts.onSave(() => {
      requestSave()
    })

    // Export PDF - store flag
    const unsubExportPdf = window.kairos.shortcuts.onExportPdf(() => {
      requestExportPdf()
    })

    // Batch Export - store flag
    const unsubBatchExport = window.kairos.shortcuts.onBatchExport(() => {
      requestBatchExport()
    })

    // Document Settings - store flag
    const unsubDocSettings = window.kairos.shortcuts.onDocumentSettings(() => {
      requestDocumentSettings()
    })

    // Tailor - store flag
    const unsubTailor = window.kairos.shortcuts.onTailor(() => {
      requestTailor()
    })

    // Navigation - store flags with direction
    const unsubPrevApp = window.kairos.shortcuts.onPrevApp(() => {
      requestNavigation('prev')
    })

    const unsubNextApp = window.kairos.shortcuts.onNextApp(() => {
      requestNavigation('next')
    })

    const unsubLatestApp = window.kairos.shortcuts.onLatestApp(() => {
      requestNavigation('latest')
    })

    const unsubOldestApp = window.kairos.shortcuts.onOldestApp(() => {
      requestNavigation('oldest')
    })

    // Toggle Sidebar - direct store call
    const unsubToggleSidebar = window.kairos.shortcuts.onToggleSidebar(() => {
      useLayoutStore.getState().toggleSidebar()
    })

    // Toggle Columns - direct store call
    const unsubToggleColumns = window.kairos.shortcuts.onToggleColumns(() => {
      useLayoutStore.getState().toggleChecklist()
    })

    return () => {
      unsubSettings()
      unsubNewApp()
      unsubSave()
      unsubExportPdf()
      unsubBatchExport()
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
    requestBatchExport,
    requestDocumentSettings,
    requestTailor,
    requestNavigation,
  ])
}

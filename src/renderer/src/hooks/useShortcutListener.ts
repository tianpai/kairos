import { useEffect } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { useShortcutStore } from '@/components/layout/shortcut.store'
import { useLayoutStore } from '@/components/layout/layout.store'
import { useBatchExportModal } from '@/components/export/BatchExportModal'

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
  const { open: openBatchExport } = useBatchExportModal()

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

    // Batch Export - open modal
    const unsubBatchExport = window.kairos.shortcuts.onBatchExport(() => {
      openBatchExport()
    })

    // Document Settings - store flag
    const unsubDocSettings = window.kairos.shortcuts.onDocumentSettings(() => {
      requestDocumentSettings()
    })

    // Tailor - store flag
    const unsubTailor = window.kairos.shortcuts.onTailor(() => {
      requestTailor()
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
      unsubToggleColumns()
    }
  }, [
    navigate,
    requestNewApplication,
    requestSave,
    requestExportPdf,
    requestDocumentSettings,
    requestTailor,
    openBatchExport,
  ])
}

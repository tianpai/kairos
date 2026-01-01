import { useState, useEffect } from 'react'
import { FileCog } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
import { DocumentConfigModal } from './DocumentConfigModal'
import { useShortcutStore } from '@/components/layout/shortcut.store'

export function DocumentConfigButton() {
  const [isOpen, setIsOpen] = useState(false)

  const documentSettingsRequested = useShortcutStore(
    (state) => state.documentSettingsRequested,
  )
  const clearDocumentSettingsRequest = useShortcutStore(
    (state) => state.clearDocumentSettingsRequest,
  )

  // Listen for keyboard shortcut
  useEffect(() => {
    if (documentSettingsRequested) {
      setIsOpen(true)
      clearDocumentSettingsRequest()
    }
  }, [documentSettingsRequested, clearDocumentSettingsRequest])

  return (
    <>
      <InvertedButton onClick={() => setIsOpen(true)} title="Document settings">
        <FileCog size={16} />
      </InvertedButton>
      <DocumentConfigModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

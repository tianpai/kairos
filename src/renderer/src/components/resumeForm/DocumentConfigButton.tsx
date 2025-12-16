import { useState } from 'react'
import { FileCog } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
import { DocumentConfigModal } from './DocumentConfigModal'

export function DocumentConfigButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <InvertedButton onClick={() => setIsOpen(true)} title="Document settings">
        <FileCog size={16} />
      </InvertedButton>
      <DocumentConfigModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

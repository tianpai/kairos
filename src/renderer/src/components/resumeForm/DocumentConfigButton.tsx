import { useState } from 'react'
import { FileCog } from 'lucide-react'
import { Button } from '@ui/Button'
import { DocumentConfigModal } from './DocumentConfigModal'

export function DocumentConfigButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <Button onClick={() => setIsOpen(true)} tooltip="Document settings">
        <FileCog size={16} />
      </Button>
      <DocumentConfigModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

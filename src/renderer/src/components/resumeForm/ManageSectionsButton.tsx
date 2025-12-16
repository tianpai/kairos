import { useState } from 'react'
import { ListPlus } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
import { SectionManagerModal } from './SectionManagerModal'

export function ManageSectionsButton() {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <>
      <InvertedButton onClick={() => setIsOpen(true)} title="Manage sections">
        <ListPlus size={16} />
      </InvertedButton>
      <SectionManagerModal isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

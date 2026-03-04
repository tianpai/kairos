import { useNavigate } from '@tanstack/react-router'
import { GalleryVerticalEnd } from 'lucide-react'
import { Button } from '@ui/Button'

interface ApplicationsButtonProps {
  staticOnly?: boolean
}

export function ApplicationsButton({
  staticOnly = false,
}: ApplicationsButtonProps) {
  const navigate = useNavigate()

  return (
    <Button
      onClick={staticOnly ? undefined : () => navigate({ to: '/' })}
      ariaLabel="All applications"
      tooltip="All applications"
    >
      <GalleryVerticalEnd size={16} />
    </Button>
  )
}

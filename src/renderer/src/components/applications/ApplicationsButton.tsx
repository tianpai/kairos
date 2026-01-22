import { useNavigate } from '@tanstack/react-router'
import { GalleryVerticalEnd } from 'lucide-react'
import { Button } from '@ui/Button'

export function ApplicationsButton() {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() => navigate({ to: '/' })}
      ariaLabel="All applications"
      title="All applications"
    >
      <GalleryVerticalEnd size={16} />
    </Button>
  )
}

import { useNavigate } from '@tanstack/react-router'
import { Settings } from 'lucide-react'
import { Button } from '@ui/Button'

export function SettingsButton() {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() => navigate({ to: '/settings' })}
      ariaLabel="Settings"
      title="Settings"
    >
      <Settings size={16} />
    </Button>
  )
}

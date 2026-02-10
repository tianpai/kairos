import { useNavigate } from '@tanstack/react-router'
import { Settings2 } from 'lucide-react'
import { Button } from '@ui/Button'

export function SettingsButton() {
  const navigate = useNavigate()

  return (
    <Button
      onClick={() =>
        navigate({
          to: '/settings',
          search: { section: undefined, update: undefined, version: undefined },
        })
      }
      ariaLabel="Settings"
      title="Settings"
    >
      <Settings2 size={16} />
    </Button>
  )
}

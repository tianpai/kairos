import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft } from 'lucide-react'
import { Button } from './Button'

export function AllApplicationBtn() {
  const navigate = useNavigate()
  return (
    <Button
      onClick={() => navigate({ to: '/' })}
      ariaLabel="Back to dashboard"
      title="Back"
    >
      <ArrowLeft size={16} />
    </Button>
  )
}

import { Columns2, Columns3 } from 'lucide-react'
import { Button } from './Button'

export function BtnToggleChecklist({
  condition,
  action,
}: {
  condition: boolean
  action: () => void
}) {
  return (
    <Button
      onClick={action}
      ariaLabel={condition ? 'Switch to 2 columns' : 'Switch to 3 columns'}
      title="Toggle columns"
    >
      {condition ? <Columns2 size={16} /> : <Columns3 size={16} />}
    </Button>
  )
}

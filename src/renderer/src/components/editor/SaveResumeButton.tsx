import { Save } from 'lucide-react'
import { Button } from '@ui/Button'
import { useSaveResume } from '@/hooks/useSaveResume'

interface SaveResumeButtonProps {
  jobId?: string
}

export default function SaveResumeButton({ jobId }: SaveResumeButtonProps) {
  const { mutate: saveResume } = useSaveResume(jobId!)

  const handleSave = () => {
    if (!jobId) return
    saveResume()
  }

  return (
    <Button
      onClick={handleSave}
      disabled={!jobId}
      ariaLabel="Save resume"
      tooltip="Save"
      className="-mr-0.5"
    >
      <Save size={16} />
    </Button>
  )
}

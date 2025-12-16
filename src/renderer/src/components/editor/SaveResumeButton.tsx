import { Save } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
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
    <InvertedButton
      onClick={handleSave}
      disabled={!jobId}
      ariaLabel="Save resume"
      title="Save"
      className="-mr-[2px]"
    >
      <Save size={16} />
    </InvertedButton>
  )
}

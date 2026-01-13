import { useEffect } from 'react'
import { Save } from 'lucide-react'
import { Button } from '@ui/Button'
import { useSaveResume } from '@/hooks/useSaveResume'
import { useShortcutStore } from '@/components/layout/shortcut.store'

interface SaveResumeButtonProps {
  jobId?: string
}

export default function SaveResumeButton({ jobId }: SaveResumeButtonProps) {
  const { mutate: saveResume } = useSaveResume(jobId!)

  const saveRequested = useShortcutStore((state) => state.saveRequested)
  const clearSaveRequest = useShortcutStore((state) => state.clearSaveRequest)

  const handleSave = () => {
    if (!jobId) return
    saveResume()
  }

  // Listen for keyboard shortcut
  useEffect(() => {
    if (saveRequested && jobId) {
      saveResume()
      clearSaveRequest()
    } else if (saveRequested) {
      clearSaveRequest()
    }
  }, [saveRequested, jobId, saveResume, clearSaveRequest])

  return (
    <Button
      onClick={handleSave}
      disabled={!jobId}
      ariaLabel="Save resume"
      title="Save"
      className="-mr-0.5"
    >
      <Save size={16} />
    </Button>
  )
}

import { CircleX } from 'lucide-react'
import { INPUT_BASE } from '@/components/resumeForm/fieldStyles'

interface FilePreviewProps {
  file: File | null
  onChangeFile: () => void
  onRemoveFile: () => void
}

export function FilePreview({
  file,
  onChangeFile,
  onRemoveFile,
}: FilePreviewProps) {
  if (!file) return null

  return (
    <div className="group relative mt-2">
      <button
        type="button"
        onClick={onChangeFile}
        className={`${INPUT_BASE} cursor-pointer truncate pr-8 text-left`}
      >
        {file.name}
      </button>
      <button
        type="button"
        onClick={onRemoveFile}
        className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        <CircleX
          size={14}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        />
      </button>
    </div>
  )
}

import { UploadCloud } from 'lucide-react'
import type { DragEvent } from 'react'

export interface FileDropzoneProps {
  onFileSelect: () => void
  onDrop: (event: DragEvent<HTMLDivElement>) => void
  onDragOver: (event: DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: DragEvent<HTMLDivElement>) => void
  isDragActive: boolean
  acceptedFileTypes: string
}

export function FileDropzone({
  onFileSelect,
  onDrop,
  onDragOver,
  onDragLeave,
  isDragActive,
  acceptedFileTypes,
}: FileDropzoneProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onFileSelect}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      className={`mt-2 flex cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed px-4 py-6 text-center transition ${
        isDragActive
          ? 'border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700'
          : 'border-gray-300 bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500'
      }`}
    >
      <UploadCloud className="h-6 w-6 text-gray-400 dark:text-gray-500" />
      <span className="text-sm text-gray-600 dark:text-gray-400">
        Drop your resume here or click to browse
      </span>
      <span className="text-xs text-gray-500 dark:text-gray-500">
        {acceptedFileTypes} (max 5MB)
      </span>
    </div>
  )
}

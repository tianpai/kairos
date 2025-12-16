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
      className={`mt-2 flex min-h-[24rem] flex-1 cursor-pointer flex-col items-center justify-center gap-2 rounded border-2 border-transparent text-center transition hover:border-gray-300 dark:hover:border-gray-600 ${
        isDragActive ? 'bg-gray-300 dark:bg-gray-700' : 'bg-gray-100 dark:bg-gray-800'
      }`}
    >
      <UploadCloud className="text-gray-400 dark:text-gray-500" />
      <span className="text-sm text-gray-600 dark:text-gray-400">Drop your resume here</span>
      <span className="text-xs text-gray-500 dark:text-gray-500">or click to browse</span>
      <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">Supported formats: {acceptedFileTypes}</p>
      <p className="mt-4 text-xs text-gray-500 dark:text-gray-500">Max file size: 5MB</p>
    </div>
  )
}

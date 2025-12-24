import { useEffect, useRef } from 'react'
import { CircleX, UploadCloud } from 'lucide-react'
import { useFileUpload } from '@/hooks/useFileUpload'
import { INPUT_BASE } from '@/components/resumeForm/fieldStyles'

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.tex'

interface FileDropzoneProps {
  onFileSelect: () => void
  onDrop: (event: React.DragEvent<HTMLDivElement>) => void
  onDragOver: (event: React.DragEvent<HTMLDivElement>) => void
  onDragLeave: (event: React.DragEvent<HTMLDivElement>) => void
  isDragActive: boolean
  acceptedFileTypes: string
}

interface SelectedFileProps {
  fileName: string
  onChangeFile: () => void
  onRemoveFile: () => void
}

function SelectedFile({
  fileName,
  onChangeFile,
  onRemoveFile,
}: SelectedFileProps) {
  return (
    <div className="group relative mt-2">
      <button
        type="button"
        onClick={onChangeFile}
        className={`${INPUT_BASE} cursor-pointer truncate pr-8 text-left`}
      >
        {fileName}
      </button>
      <button
        type="button"
        onClick={onRemoveFile}
        className="absolute top-1/2 right-2 -translate-y-1/2 p-0.5 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
      >
        <CircleX
          size={14}
          className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
        />
      </button>
    </div>
  )
}

function FileDropzone({
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
      className={`mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm transition ${
        isDragActive
          ? 'border-gray-400 bg-gray-200 dark:border-gray-500 dark:bg-gray-700'
          : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
      }`}
    >
      <UploadCloud className="h-4 w-4 text-gray-400 dark:text-gray-500" />
      <span className="text-gray-500 dark:text-gray-400">
        Drop or click to upload ({acceptedFileTypes})
      </span>
    </div>
  )
}

export interface ResumeUploadSectionProps {
  selectedFile: File | null
  onFileChange: (file: File | null) => void
}

export default function ResumeUploadSection({
  selectedFile,
  onFileChange,
}: ResumeUploadSectionProps) {
  const fileUpload = useFileUpload()
  const hasFile = Boolean(fileUpload.selectedFile)
  const prevSelectedFileRef = useRef<File | null>(null)

  useEffect(() => {
    if (prevSelectedFileRef.current !== null && selectedFile === null) {
      if (fileUpload.selectedFile !== null) {
        fileUpload.resetFileUpload()
      }
    }
    prevSelectedFileRef.current = selectedFile
  }, [selectedFile])

  useEffect(() => {
    if (fileUpload.selectedFile !== selectedFile) {
      onFileChange(fileUpload.selectedFile)
    }
  }, [fileUpload.selectedFile, selectedFile, onFileChange])

  return (
    <section className="flex min-w-0 flex-col">
      <input
        ref={fileUpload.fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={fileUpload.handleInputChange}
        className="sr-only"
      />

      {hasFile ? (
        <SelectedFile
          fileName={fileUpload.selectedFile?.name ?? ''}
          onChangeFile={fileUpload.triggerFileDialog}
          onRemoveFile={fileUpload.removeSelectedFile}
        />
      ) : (
        <FileDropzone
          onFileSelect={fileUpload.triggerFileDialog}
          onDrop={fileUpload.handleDrop}
          onDragOver={fileUpload.handleDragOver}
          onDragLeave={fileUpload.handleDragLeave}
          isDragActive={fileUpload.isDragActive}
          acceptedFileTypes={ACCEPTED_FILE_TYPES}
        />
      )}
    </section>
  )
}

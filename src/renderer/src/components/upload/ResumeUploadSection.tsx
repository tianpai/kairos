import { useEffect, useRef } from 'react'
import { CircleX, UploadCloud } from 'lucide-react'
import { useUpload } from './useUpload'
import type { WorkflowResumeFile } from '@type/workflow-ipc'
import { INPUT_BASE } from '@/components/resumeForm/fieldStyles'

interface FileDropzoneProps {
  dropzoneProps: ReturnType<typeof useUpload>['dropzoneProps']
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
        <CircleX size={14} className="text-hint hover:text-secondary" />
      </button>
    </div>
  )
}

function FileDropzone({
  dropzoneProps,
  isDragActive,
  acceptedFileTypes,
}: FileDropzoneProps) {
  return (
    <div
      {...dropzoneProps}
      className={`mt-2 flex cursor-pointer items-center gap-2 rounded-md border border-dashed px-3 py-2 text-sm transition ${
        isDragActive
          ? 'border-hint bg-hover'
          : 'border-default hover:border-hint'
      }`}
    >
      <UploadCloud className="text-hint h-4 w-4" />
      <span className="text-hint">
        Drop or click to upload ({acceptedFileTypes})
      </span>
    </div>
  )
}

export interface ResumeUploadSectionProps {
  resumeFile: WorkflowResumeFile | null
  onResumeFileChange: (file: WorkflowResumeFile | null) => void
}

export default function ResumeUploadSection({
  resumeFile,
  onResumeFileChange,
}: ResumeUploadSectionProps) {
  const fileUpload = useUpload({
    purpose: 'resume',
    onFile: onResumeFileChange,
  })
  const hasFile = Boolean(fileUpload.fileName)
  const prevResumeFileRef = useRef<WorkflowResumeFile | null>(null)
  const {
    clear,
    error,
    fileName,
    inputProps,
    isDragActive,
    triggerFileDialog,
  } = fileUpload

  useEffect(() => {
    if (prevResumeFileRef.current !== null && resumeFile === null) {
      clear()
    }
    prevResumeFileRef.current = resumeFile
  }, [clear, resumeFile])

  return (
    <section className="flex min-w-0 flex-col">
      <input {...inputProps} className="sr-only" />

      {hasFile ? (
        <SelectedFile
          fileName={fileName ?? ''}
          onChangeFile={triggerFileDialog}
          onRemoveFile={clear}
        />
      ) : (
        <FileDropzone
          dropzoneProps={fileUpload.dropzoneProps}
          isDragActive={isDragActive}
          acceptedFileTypes={inputProps.accept}
        />
      )}

      {error && <p className="text-error mt-2 text-xs">{error}</p>}
      {fileUpload.isProcessing && (
        <p className="text-hint mt-2 text-xs">Reading file...</p>
      )}
    </section>
  )
}

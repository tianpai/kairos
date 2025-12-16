import { useEffect, useRef } from 'react'
import { FileDropzone } from './FileDropzone'
import { FilePreview } from './FilePreview'
import { useFileUpload } from '@/hooks/useFileUpload'

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.tex'

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
      <h2 className="text-lg font-semibold">Upload resume</h2>
      <input
        ref={fileUpload.fileInputRef}
        type="file"
        accept={ACCEPTED_FILE_TYPES}
        onChange={fileUpload.handleInputChange}
        className="sr-only"
      />

      {hasFile ? (
        <FilePreview
          file={fileUpload.selectedFile}
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

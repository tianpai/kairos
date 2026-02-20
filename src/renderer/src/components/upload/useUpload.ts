import { useCallback } from 'react'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import type { FileToTextPolicy } from '@/hooks/useFileToText'
import { extractResumeText } from '@/utils/resumeTextExtractor'
import { useFileSelect } from '@/hooks/useFileSelect'
import { useFileToText } from '@/hooks/useFileToText'

const JOB_DESCRIPTION_MAX_SIZE_KB = 50

export type UploadPurpose = 'resume' | 'jobDescription'

interface UseUploadOptions {
  purpose: UploadPurpose
  onText?: (text: string) => void
  onError?: (message: string) => void
}

interface UploadInputProps {
  ref: RefObject<HTMLInputElement | null>
  type: 'file'
  accept: string
  onChange: (event: ChangeEvent<HTMLInputElement>) => void
}

interface UploadDropzoneProps {
  role: 'button'
  tabIndex: 0
  onClick: () => void
  onDrop: (event: DragEvent<HTMLElement>) => void
  onDragOver: (event: DragEvent<HTMLElement>) => void
  onDragLeave: (event: DragEvent<HTMLElement>) => void
}

interface UseUploadReturn {
  inputProps: UploadInputProps
  dropzoneProps: UploadDropzoneProps
  fileName: string | null
  text: string | null
  isDragActive: boolean
  isProcessing: boolean
  error: string | null
  triggerFileDialog: () => void
  clear: () => void
}

const uploadPolicies: Record<UploadPurpose, FileToTextPolicy> = {
  resume: {
    acceptedExtensions: ['.pdf', '.docx', '.txt'],
    toText: extractResumeText,
  },
  jobDescription: {
    acceptedExtensions: ['.md', '.txt'],
    maxSizeKB: JOB_DESCRIPTION_MAX_SIZE_KB,
    toText: (file: File) => file.text(),
  },
}

export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const { purpose, onText, onError } = options

  const {
    text,
    error,
    isProcessing,
    acceptedFileTypes,
    processFile,
    clearText,
  } = useFileToText({
    policy: uploadPolicies[purpose],
    onTextReady: onText,
    onError,
  })

  const handleFileSelect = useCallback(
    (file: File | null) => {
      void processFile(file)
    },
    [processFile],
  )

  const {
    fileInputRef,
    selectedFile,
    isDragActive,
    handleInputChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    triggerFileDialog,
    clearSelectedFile,
  } = useFileSelect({
    onFileSelect: handleFileSelect,
  })

  const clear = useCallback(() => {
    clearSelectedFile()
    clearText()
  }, [clearSelectedFile, clearText])

  return {
    inputProps: {
      ref: fileInputRef,
      type: 'file',
      accept: acceptedFileTypes,
      onChange: handleInputChange,
    },
    dropzoneProps: {
      role: 'button',
      tabIndex: 0,
      onClick: triggerFileDialog,
      onDrop: handleDrop,
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
    },
    fileName: selectedFile?.name ?? null,
    text,
    isDragActive,
    isProcessing,
    error,
    triggerFileDialog,
    clear,
  }
}

import { useCallback, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import type { ResumeFile } from '@/components/upload/newApplication.store'
import { useFileSelect } from '@/hooks/useFileSelect'

const JOB_DESCRIPTION_MAX_SIZE_KB = 50

export type UploadPurpose = 'resume' | 'jobDescription'

interface UseUploadOptions {
  purpose: UploadPurpose
  onText?: (text: string) => void
  onFile?: (file: ResumeFile | null) => void
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

const uploadPolicies = {
  resume: {
    acceptedExtensions: ['.pdf', '.docx', '.txt'],
  },
  jobDescription: {
    acceptedExtensions: ['.md', '.txt'],
    maxSizeKB: JOB_DESCRIPTION_MAX_SIZE_KB,
  },
} as const

function normalizeExtension(extension: string): string {
  const trimmed = extension.trim().toLowerCase()
  if (!trimmed) return ''
  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`
}

function getFileExtension(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? `.${extension}` : null
}

export function useUpload(options: UseUploadOptions): UseUploadReturn {
  const { purpose, onText, onFile, onError } = options
  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const requestIdRef = useRef(0)

  const policy = uploadPolicies[purpose]

  const acceptedExtensions = useMemo(
    () =>
      policy.acceptedExtensions
        .map(normalizeExtension)
        .filter((extension) => extension.length > 0),
    [policy.acceptedExtensions],
  )

  const acceptedSet = useMemo(
    () => new Set(acceptedExtensions),
    [acceptedExtensions],
  )

  const acceptedFileTypes = acceptedExtensions.join(',')

  const validateFile = useCallback(
    (file: File): string | null => {
      const extension = getFileExtension(file.name)
      if (!extension || !acceptedSet.has(extension)) {
        return `Unsupported file type. Allowed: ${acceptedExtensions.join(', ')}`
      }

      if ('maxSizeKB' in policy && policy.maxSizeKB) {
        if (file.size > policy.maxSizeKB * 1024) {
          return `File exceeds ${policy.maxSizeKB}KB limit`
        }
      }

      return null
    },
    [acceptedExtensions, acceptedSet, policy],
  )

  const processFile = useCallback(
    async (file: File | null): Promise<void> => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (!file) {
        setText(null)
        setError(null)
        setIsProcessing(false)
        onFile?.(null)
        return
      }

      const validationError = validateFile(file)
      if (validationError) {
        setText(null)
        setError(validationError)
        setIsProcessing(false)
        onFile?.(null)
        onError?.(validationError)
        return
      }

      setIsProcessing(true)
      setText(null)
      setError(null)

      try {
        if (purpose === 'jobDescription') {
          const content = await file.text()
          if (requestId !== requestIdRef.current) {
            return
          }

          setText(content)
          onText?.(content)
          return
        }

        const data = await file.arrayBuffer()
        if (requestId !== requestIdRef.current) {
          return
        }

        onFile?.({
          fileName: file.name,
          data,
        })
      } catch (cause) {
        if (requestId !== requestIdRef.current) {
          return
        }

        const message =
          cause instanceof Error ? cause.message : 'Failed to read file'
        setText(null)
        setError(message)
        onFile?.(null)
        onError?.(message)
      } finally {
        if (requestId === requestIdRef.current) {
          setIsProcessing(false)
        }
      }
    },
    [onError, onFile, onText, purpose, validateFile],
  )

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
    requestIdRef.current += 1
    clearSelectedFile()
    setText(null)
    setError(null)
    setIsProcessing(false)
    onFile?.(null)
  }, [clearSelectedFile, onFile])

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

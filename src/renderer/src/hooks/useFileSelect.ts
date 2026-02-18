import { useCallback, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, RefObject } from 'react'
import { useDropzone } from '@/hooks/useDropzone'

interface UseFileSelectOptions {
  onFileSelect?: (file: File | null) => void
}

interface UseFileSelectReturn {
  fileInputRef: RefObject<HTMLInputElement | null>
  selectedFile: File | null
  isDragActive: boolean
  handleInputChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleDrop: (event: DragEvent<HTMLElement>) => void
  handleDragOver: (event: DragEvent<HTMLElement>) => void
  handleDragLeave: (event: DragEvent<HTMLElement>) => void
  triggerFileDialog: () => void
  clearSelectedFile: () => void
}

export function useFileSelect(
  options: UseFileSelectOptions = {},
): UseFileSelectReturn {
  const { onFileSelect } = options

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const selectFile = useCallback(
    (file: File | null) => {
      setSelectedFile(file)
      onFileSelect?.(file)
    },
    [onFileSelect],
  )

  const handleInputChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0] ?? null
      selectFile(file)
      event.target.value = ''
    },
    [selectFile],
  )

  const {
    isDragActive,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    resetDropzone,
  } = useDropzone({
    onFileDrop: selectFile,
  })

  const triggerFileDialog = useCallback(() => {
    fileInputRef.current?.click()
  }, [])

  const clearSelectedFile = useCallback(() => {
    resetDropzone()
    selectFile(null)
  }, [resetDropzone, selectFile])

  return {
    fileInputRef,
    selectedFile,
    isDragActive,
    handleInputChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    triggerFileDialog,
    clearSelectedFile,
  }
}

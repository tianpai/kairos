import { useRef, useState } from 'react'
import type { ChangeEvent, DragEvent } from 'react'

const DEFAULT_MAX_SIZE_KB = 50
const DEFAULT_ACCEPTED_EXTENSIONS = ['.md', '.txt']

interface UseTextFileUploadOptions {
  maxSizeKB?: number
  acceptedExtensions?: string[]
  onTextRead?: (text: string) => void
}

export function useTextFileUpload(options: UseTextFileUploadOptions = {}) {
  const {
    maxSizeKB = DEFAULT_MAX_SIZE_KB,
    acceptedExtensions = DEFAULT_ACCEPTED_EXTENSIONS,
    onTextRead,
  } = options

  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const [isDragActive, setIsDragActive] = useState(false)

  function isValidFile(file: File): boolean {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!acceptedExtensions.includes(extension)) {
      return false
    }
    if (file.size > maxSizeKB * 1024) {
      return false
    }
    return true
  }

  function readFileAsText(file: File): void {
    if (!isValidFile(file)) {
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const text = event.target?.result
      if (typeof text === 'string') {
        onTextRead?.(text)
      }
    }
    reader.readAsText(file)
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (file) {
      readFileAsText(file)
    }
    event.target.value = ''
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    event.stopPropagation()
    setIsDragActive(false)
    const file = event.dataTransfer.files[0]
    if (file) {
      readFileAsText(file)
    }
  }

  function handleDragOver(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    if (!isDragActive) {
      setIsDragActive(true)
    }
  }

  function handleDragLeave(event: DragEvent<HTMLElement>) {
    event.preventDefault()
    const related = event.relatedTarget as Node | null
    if (related && event.currentTarget.contains(related)) {
      return
    }
    setIsDragActive(false)
  }

  function triggerFileDialog() {
    fileInputRef.current?.click()
  }

  const acceptedFileTypes = acceptedExtensions.join(',')

  return {
    fileInputRef,
    isDragActive,
    acceptedFileTypes,
    handleInputChange,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    triggerFileDialog,
  }
}

import { useCallback, useState } from 'react'
import type { DragEvent } from 'react'

interface UseDropzoneOptions {
  onFileDrop?: (file: File | null) => void
}

interface UseDropzoneReturn {
  isDragActive: boolean
  handleDrop: (event: DragEvent<HTMLElement>) => void
  handleDragOver: (event: DragEvent<HTMLElement>) => void
  handleDragLeave: (event: DragEvent<HTMLElement>) => void
  resetDropzone: () => void
}

export function useDropzone(
  options: UseDropzoneOptions = {},
): UseDropzoneReturn {
  const { onFileDrop } = options
  const [isDragActive, setIsDragActive] = useState(false)

  const handleDrop = useCallback(
    (event: DragEvent<HTMLElement>) => {
      event.preventDefault()
      event.stopPropagation()
      setIsDragActive(false)

      const file = event.dataTransfer.files[0] ?? null
      onFileDrop?.(file)
    },
    [onFileDrop],
  )

  const handleDragOver = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    setIsDragActive(true)
  }, [])

  const handleDragLeave = useCallback((event: DragEvent<HTMLElement>) => {
    event.preventDefault()
    const related = event.relatedTarget as Node | null
    if (related && event.currentTarget.contains(related)) {
      return
    }
    setIsDragActive(false)
  }, [])

  const resetDropzone = useCallback(() => {
    setIsDragActive(false)
  }, [])

  return {
    isDragActive,
    handleDrop,
    handleDragOver,
    handleDragLeave,
    resetDropzone,
  }
}

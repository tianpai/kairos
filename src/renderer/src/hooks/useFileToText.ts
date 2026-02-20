import { useCallback, useMemo, useRef, useState } from 'react'

export interface FileToTextPolicy {
  acceptedExtensions: Array<string>
  maxSizeKB?: number
  toText: (file: File) => Promise<string>
}

interface UseFileToTextOptions {
  policy: FileToTextPolicy
  onTextReady?: (text: string) => void
  onError?: (message: string) => void
}

interface UseFileToTextReturn {
  text: string | null
  error: string | null
  isProcessing: boolean
  acceptedFileTypes: string
  processFile: (file: File | null) => Promise<string | null>
  clearText: () => void
}

function normalizeExtension(extension: string): string {
  const trimmed = extension.trim().toLowerCase()
  if (!trimmed) return ''
  return trimmed.startsWith('.') ? trimmed : `.${trimmed}`
}

function getFileExtension(fileName: string): string | null {
  const extension = fileName.split('.').pop()?.toLowerCase()
  return extension ? `.${extension}` : null
}

export function useFileToText(
  options: UseFileToTextOptions,
): UseFileToTextReturn {
  const { policy, onTextReady, onError } = options

  const [text, setText] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const requestIdRef = useRef(0)

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

      if (policy.maxSizeKB && file.size > policy.maxSizeKB * 1024) {
        return `File exceeds ${policy.maxSizeKB}KB limit`
      }

      return null
    },
    [acceptedExtensions, acceptedSet, policy.maxSizeKB],
  )

  const processFile = useCallback(
    async (file: File | null): Promise<string | null> => {
      const requestId = requestIdRef.current + 1
      requestIdRef.current = requestId

      if (!file) {
        setText(null)
        setError(null)
        setIsProcessing(false)
        return null
      }

      const validationError = validateFile(file)
      if (validationError) {
        setText(null)
        setError(validationError)
        setIsProcessing(false)
        onError?.(validationError)
        return null
      }

      setIsProcessing(true)
      setText(null)
      setError(null)

      try {
        const nextText = await policy.toText(file)
        if (requestId !== requestIdRef.current) {
          return null
        }

        setText(nextText)
        onTextReady?.(nextText)
        return nextText
      } catch (cause) {
        if (requestId !== requestIdRef.current) {
          return null
        }

        const message =
          cause instanceof Error ? cause.message : 'Failed to read file'
        setText(null)
        setError(message)
        onError?.(message)
        return null
      } finally {
        if (requestId === requestIdRef.current) {
          setIsProcessing(false)
        }
      }
    },
    [onError, onTextReady, policy, validateFile],
  )

  const clearText = useCallback(() => {
    requestIdRef.current += 1
    setText(null)
    setError(null)
    setIsProcessing(false)
  }, [])

  return {
    text,
    error,
    isProcessing,
    acceptedFileTypes,
    processFile,
    clearText,
  }
}

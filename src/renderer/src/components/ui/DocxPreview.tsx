import { useEffect, useRef, useState } from 'react'

type DocxPreviewProps = {
  file: File
}

export function DocxPreview({ file }: DocxPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const styleContainerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    const styleContainer = styleContainerRef.current

    if (!container || !styleContainer) {
      return
    }

    const clearContainers = () => {
      container.textContent = ''
      container.style.removeProperty('height')
      styleContainer.textContent = ''
    }

    clearContainers()
    setError(null)

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const isAborted = () => controller.signal.aborted

    setIsLoading(true)

    async function loadDocx() {
      try {
        const arrayBuffer = await file.arrayBuffer()

        if (isAborted()) {
          return
        }

        if (!containerRef.current || !styleContainerRef.current) {
          return
        }

        const { renderAsync } = await import('docx-preview')

        await renderAsync(
          arrayBuffer,
          containerRef.current,
          styleContainerRef.current,
          {
            className: 'docx-preview-content',
            inWrapper: true,
          },
        )

        injectCustomStyles(styleContainerRef.current)

        if (isAborted()) return

        adjustRenderedDocument(containerRef.current)

        if (!isAborted()) {
          setIsLoading(false)
        }
      } catch (renderError) {
        if (isAborted()) {
          return
        }
        setError('Unable to render preview for this document.')
        setIsLoading(false)
      }
    }

    loadDocx()

    return () => {
      controller.abort()
      abortControllerRef.current = null
      clearContainers()
    }
  }, [file])

  return (
    <>
      {isLoading && <div className="p-4 text-sm">Loading preview...</div>}
      {error && <div className="p-4 text-sm text-red-600">{error}</div>}
      <div className="relative flex h-full w-full justify-center overflow-auto">
        <div ref={styleContainerRef} />
        <div ref={containerRef} className="mx-auto flex flex-col" />
      </div>
    </>
  )
}

function adjustRenderedDocument(container: HTMLElement) {
  requestAnimationFrame(() => {
    const parent = container.parentElement
    const parentWidth = parent?.clientWidth ?? container.clientWidth
    if (parentWidth <= 0) {
      return
    }

    const wrappers = Array.from(
      container.querySelectorAll<HTMLElement>('.docx-wrapper'),
    )
    if (wrappers.length === 0) {
      return
    }

    let totalScaledHeight = 0

    const maxPageWidth = Math.min(parentWidth, 512)

    wrappers.forEach((wrapper) => {
      const originalWidth = wrapper.scrollWidth
      const originalHeight = wrapper.scrollHeight
      if (!originalWidth || !originalHeight) {
        return
      }

      const targetWidth = Math.min(originalWidth, maxPageWidth)
      const scale = Math.min(1, targetWidth / originalWidth)
      wrapper.style.display = 'block'
      wrapper.style.position = 'relative'
      wrapper.style.transformOrigin = 'top left'
      wrapper.style.transform = `scale(${scale})`
      wrapper.style.margin = '0 auto'
      totalScaledHeight += originalHeight * scale
    })

    container.style.position = 'relative'
    container.style.height = `${totalScaledHeight}px`
    container.style.width = `${Math.min(parentWidth, maxPageWidth)}px`
    container.style.display = 'block'
    container.style.margin = '0 auto'
  })
}

function injectCustomStyles(styleContainer: HTMLDivElement) {
  const customStyles = `
    .docx-preview-content-wrapper {
      background: transparent !important;
      padding: 0 !important;
      align-items: center !important;
      display: flex !important;
      flex-direction: column !important;
      gap: 1.5rem;
    }

    .docx-preview-content-wrapper > section.docx-preview-content {
      background: #fff !important;
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12) !important;
      margin-bottom: 0 !important;
      border-radius: 0.75rem !important;
      width: auto !important;
      max-width: 48rem !important;
      padding: 3.5rem 3.75rem 3.25rem !important;
    }

    .docx-wrapper {
      padding: 0 !important;
      background: transparent !important;
    }
  `

  const existing = styleContainer.querySelector<HTMLStyleElement>(
    'style[data-docx-preview-custom="true"]',
  )
  if (existing) {
    existing.textContent = customStyles
    return
  }

  const styleEl = document.createElement('style')
  styleEl.dataset.docxPreviewCustom = 'true'
  styleEl.textContent = customStyles
  styleContainer.appendChild(styleEl)
}

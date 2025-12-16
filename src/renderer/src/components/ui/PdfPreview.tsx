import { useEffect, useRef, useState } from 'react'

type PdfPreviewProps = {
  file: File
}

export function PdfPreview({ file }: PdfPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    const container = containerRef.current

    if (!container) {
      return
    }

    const clearContainer = () => {
      container.textContent = ''
    }

    clearContainer()
    setError(null)

    abortControllerRef.current?.abort()
    const controller = new AbortController()
    abortControllerRef.current = controller
    const isAborted = () => controller.signal.aborted

    setIsLoading(true)

    async function loadPdf() {
      try {
        const arrayBuffer = await file.arrayBuffer()

        if (isAborted()) {
          return
        }

        const pdfjsLib = await import('pdfjs-dist')

        // Use unpkg CDN which is more reliable
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`

        if (isAborted()) {
          return
        }

        const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
        const pdf = await loadingTask.promise

        if (isAborted()) {
          return
        }

        // Clear container again before rendering (in case of race conditions)
        if (containerRef.current) {
          containerRef.current.textContent = ''
        }

        // Render only first 3 pages for performance
        const maxPages = Math.min(pdf.numPages, 3)

        for (let pageNum = 1; pageNum <= maxPages; pageNum++) {
          if (isAborted()) {
            return
          }

          const page = await pdf.getPage(pageNum)
          const viewport = page.getViewport({ scale: 1.0 })

          // Create canvas for this page
          const canvas = document.createElement('canvas')
          const context = canvas.getContext('2d')
          if (!context) {
            continue
          }

          canvas.height = viewport.height
          canvas.width = viewport.width
          canvas.className = 'pdf-page-canvas'

          // Render page
          await page.render({
            canvas: canvas,
            viewport: viewport,
          }).promise

          if (isAborted() || !containerRef.current) {
            return
          }

          containerRef.current.appendChild(canvas)
        }

        if (pdf.numPages > maxPages && containerRef.current) {
          const moreInfo = document.createElement('div')
          moreInfo.className = 'text-center text-sm text-slate-500 py-4'
          moreInfo.textContent = `Showing first ${maxPages} of ${pdf.numPages} pages`
          containerRef.current.appendChild(moreInfo)
        }

        if (!isAborted()) {
          setIsLoading(false)
        }
      } catch (renderError) {
        if (isAborted()) {
          return
        }
        setError(
          `Unable to render preview: ${renderError instanceof Error ? renderError.message : 'Unknown error'}`,
        )
        setIsLoading(false)
      }
    }

    loadPdf()

    return () => {
      controller.abort()
      abortControllerRef.current = null
      clearContainer()
    }
  }, [file])

  return (
    <>
      {isLoading && <div className="p-4 text-sm">Loading preview...</div>}
      {error && <div className="p-4 text-sm text-red-600">{error}</div>}
      <div className="relative flex h-full w-full justify-center overflow-auto">
        <div
          ref={containerRef}
          className="mx-auto flex flex-col"
          style={{ maxWidth: '512px' }}
        />
      </div>
      <style>{`
        .pdf-page-canvas {
          max-width: 100%;
          height: auto;
          display: block;
        }
      `}</style>
    </>
  )
}

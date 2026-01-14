import { useEffect } from 'react'
import { FileUp, X } from 'lucide-react'
import { MAX_ENTRIES, useNewApplicationStore } from './newApplication.store'
import type { JdEntry } from './newApplication.store'
import { useTextFileUpload } from '@/hooks/useTextFileUpload'

// Unified JD entry box with textarea, file upload, and URL
function JdEntryCard({
  entry,
  canRemove,
  isLast,
}: {
  entry: JdEntry
  canRemove: boolean
  isLast: boolean
}) {
  const updateEntry = useNewApplicationStore((s) => s.updateEntry)
  const removeEntry = useNewApplicationStore((s) => s.removeEntry)
  const hasContent = entry.jobDescription.trim().length > 0
  // Show X if: can remove AND (has content OR not the last empty one)
  const showRemove = canRemove && (hasContent || !isLast)
  const fileUpload = useTextFileUpload({
    onTextRead: (text) => updateEntry(entry.id, 'jobDescription', text),
  })

  return (
    <div
      onDrop={fileUpload.handleDrop}
      onDragOver={fileUpload.handleDragOver}
      onDragLeave={fileUpload.handleDragLeave}
      className={`relative flex flex-col rounded-md border border-default transition-colors ${fileUpload.isDragActive ? 'ring-2 ring-hint' : ''}`}
    >
      {/* Top bar with upload, URL, and remove */}
      <div className="flex items-center gap-2 border-b border-default px-2 py-1">
        <button
          type="button"
          onClick={fileUpload.triggerFileDialog}
          className="flex shrink-0 items-center gap-1 rounded px-1 py-0.5 text-xs text-hint transition-colors hover:bg-hover hover:text-secondary"
          title="Upload .md or .txt file"
        >
          <FileUp className="h-3.5 w-3.5" />
          <span>Upload</span>
        </button>
        <input
          ref={fileUpload.fileInputRef}
          type="file"
          accept={fileUpload.acceptedFileTypes}
          onChange={fileUpload.handleInputChange}
          className="sr-only"
        />
        <input
          id={`url-${entry.id}`}
          type="text"
          value={entry.jobUrl}
          onChange={(e) => updateEntry(entry.id, 'jobUrl', e.target.value)}
          onPaste={(e) => {
            const input = e.currentTarget
            requestAnimationFrame(() => {
              input.scrollLeft = 0
              input.setSelectionRange(0, 0)
            })
          }}
          placeholder="Job posting URL (optional)"
          className="min-w-0 flex-1 bg-transparent px-2 py-0.5 text-xs text-hint focus:outline-none"
        />
        {showRemove && (
          <button
            type="button"
            onClick={() => removeEntry(entry.id)}
            className="shrink-0 rounded p-1 text-hint transition-colors hover:bg-hover hover:text-secondary"
            title="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Textarea */}
      <textarea
        id={`jd-${entry.id}`}
        value={entry.jobDescription}
        onChange={(e) => updateEntry(entry.id, 'jobDescription', e.target.value)}
        placeholder="Paste job posting or enter details (company, position, requirements...)"
        rows={6}
        className="w-full resize-none bg-transparent px-3 py-2 text-sm focus:outline-none"
      />
    </div>
  )
}

export default function JobDetailsSection() {
  const entries = useNewApplicationStore((s) => s.entries)
  const addEntry = useNewApplicationStore((s) => s.addEntry)

  // Auto-add new entry when last one is filled
  useEffect(() => {
    if (entries.length >= MAX_ENTRIES) return
    const lastEntry = entries[entries.length - 1]
    if (lastEntry && lastEntry.jobDescription.trim().length > 0) {
      addEntry()
    }
  }, [entries, addEntry])

  return (
    <section className="flex min-w-0 flex-col">
      <div className="mt-2 flex flex-col space-y-3">
        <span className="text-sm font-medium text-secondary">Job Descriptions</span>

        <div className="flex flex-col gap-4">
          {entries.map((entry, index) => (
            <JdEntryCard
              key={entry.id}
              entry={entry}
              canRemove={entries.length > 1}
              isLast={index === entries.length - 1}
            />
          ))}
        </div>

        <p className="text-xs text-hint">
          Each box creates one application. Add up to {MAX_ENTRIES} at once.
        </p>
      </div>
    </section>
  )
}

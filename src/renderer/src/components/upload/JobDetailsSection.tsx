import { FileUp, Plus, X } from 'lucide-react'
import { InputField } from '@ui/InputField'
import { MAX_ENTRIES, useNewApplicationStore } from './newApplication.store'
import type { JdEntry } from './newApplication.store'
import { INPUT_TEXTAREA } from '@/components/resumeForm/fieldStyles'
import { useTextFileUpload } from '@/hooks/useTextFileUpload'

// Textarea with file upload support
function JdTextarea({
  id,
  value,
  onChange,
}: {
  id: string
  value: string
  onChange: (value: string) => void
}) {
  const fileUpload = useTextFileUpload({ onTextRead: onChange })

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={fileUpload.triggerFileDialog}
          className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Upload .md or .txt file"
        >
          <FileUp className="h-4 w-4" />
        </button>
        <input
          ref={fileUpload.fileInputRef}
          type="file"
          accept={fileUpload.acceptedFileTypes}
          onChange={fileUpload.handleInputChange}
          className="sr-only"
        />
      </div>
      <div
        onDrop={fileUpload.handleDrop}
        onDragOver={fileUpload.handleDragOver}
        onDragLeave={fileUpload.handleDragLeave}
        className={`rounded-lg transition-colors ${fileUpload.isDragActive ? 'ring-2 ring-gray-400 dark:ring-gray-500' : ''}`}
      >
        <textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Paste the job description here..."
          rows={6}
          className={`${INPUT_TEXTAREA} overflow-y-auto`}
        />
      </div>
    </div>
  )
}

// Entry card
function JdEntryCard({
  entry,
  canRemove,
}: {
  entry: JdEntry
  canRemove: boolean
}) {
  const updateEntry = useNewApplicationStore((s) => s.updateEntry)
  const removeEntry = useNewApplicationStore((s) => s.removeEntry)

  return (
    <div className="relative rounded-lg border border-gray-200 p-3 dark:border-gray-700">
      {canRemove && (
        <button
          type="button"
          onClick={() => removeEntry(entry.id)}
          className="absolute top-2 right-2 rounded p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
          title="Remove"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      <div className="flex flex-col gap-2">
        <JdTextarea
          id={`jd-${entry.id}`}
          value={entry.jobDescription}
          onChange={(v) => updateEntry(entry.id, 'jobDescription', v)}
        />
        <InputField
          id={`url-${entry.id}`}
          label="Job URL"
          type="text"
          value={entry.jobUrl}
          onChange={(v) => updateEntry(entry.id, 'jobUrl', v)}
          placeholder="https://..."
        />
      </div>
    </div>
  )
}

export interface JobDetailsSectionProps {
  requireJobDescription?: boolean
}

export default function JobDetailsSection({
  requireJobDescription = true,
}: JobDetailsSectionProps) {
  const entries = useNewApplicationStore((s) => s.entries)
  const addEntry = useNewApplicationStore((s) => s.addEntry)
  const canAddMore = entries.length < MAX_ENTRIES

  return (
    <section className="flex min-w-0 flex-col">
      <div className="mt-2 flex flex-col space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Job Descriptions{' '}
            {!requireJobDescription && (
              <span className="font-normal text-gray-400 dark:text-gray-500">
                (optional)
              </span>
            )}
          </span>
          {canAddMore && (
            <button
              type="button"
              onClick={addEntry}
              className="flex items-center gap-1 rounded px-2 py-1 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {entries.map((entry) => (
            <JdEntryCard
              key={entry.id}
              entry={entry}
              canRemove={entries.length > 1}
            />
          ))}
        </div>

        <p className="text-xs text-gray-500 dark:text-gray-400">
          Company, position, and due date will be automatically extracted from
          each job description.
        </p>
      </div>
    </section>
  )
}

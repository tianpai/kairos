import { useState } from 'react'
import { FileUp } from 'lucide-react'
import { InputField } from '@ui/InputField'
import { DatePicker } from '@ui/DatePicker'
import type { JobApplicationInput } from '@/api/jobs'
import { INPUT_TEXTAREA, LABEL_BASE } from '@/components/resumeForm/fieldStyles'
import { useTextFileUpload } from '@/hooks/useTextFileUpload'

function normalizeUrl(url: string): string | undefined {
  const trimmed = url.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

export type JobApplicationFormData = Omit<
  JobApplicationInput,
  'rawResumeContent'
>

export interface JobDetailsSectionProps {
  onFormChange: (data: JobApplicationFormData, isValid: boolean) => void
  requireJobDescription?: boolean
}

export default function JobDetailsSection({
  onFormChange,
  requireJobDescription = true,
}: JobDetailsSectionProps) {
  const [jobDescription, setJobDescription] = useState('')
  const [companyName, setCompanyName] = useState('')
  const [position, setPosition] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [jobUrl, setJobUrl] = useState('')

  const textFileUpload = useTextFileUpload({
    onTextRead: (text) => {
      setJobDescription(text)
      handleFormChange({ jobDescription: text })
    },
  })

  const handleFormChange = (updates?: {
    jobDescription?: string
    companyName?: string
    position?: string
    dueDate?: string
    jobUrl?: string
  }) => {
    const currentJobDescription = updates?.jobDescription ?? jobDescription
    const currentCompanyName = updates?.companyName ?? companyName
    const currentPosition = updates?.position ?? position
    const currentDueDate = updates?.dueDate ?? dueDate
    const currentJobUrl = updates?.jobUrl ?? jobUrl

    const formData: JobApplicationFormData = {
      jobDescription: currentJobDescription.trim(),
      companyName: currentCompanyName.trim(),
      position: currentPosition.trim(),
      dueDate: currentDueDate,
      jobUrl: normalizeUrl(currentJobUrl),
    }
    const isValid = Boolean(
      currentCompanyName.trim() &&
      currentPosition.trim() &&
      currentDueDate &&
      (requireJobDescription ? currentJobDescription.trim() : true),
    )
    onFormChange(formData, isValid)
  }

  return (
    <section className="flex min-w-0 flex-col">
      <div className="mt-2 flex flex-col space-y-2">
        <div className="grid grid-cols-2 gap-4">
          <InputField
            id="companyName"
            label="Company"
            type="text"
            value={companyName}
            onChange={(value) => {
              setCompanyName(value)
              handleFormChange({ companyName: value })
            }}
            placeholder="Google, Apple, etc."
          />
          <InputField
            id="position"
            label="Position"
            type="text"
            value={position}
            onChange={(value) => {
              setPosition(value)
              handleFormChange({ position: value })
            }}
            placeholder="Software Engineer"
          />
          <DatePicker
            id="dueDate"
            label="Application Due Date"
            value={dueDate}
            onChange={(value) => {
              setDueDate(value)
              handleFormChange({ dueDate: value })
            }}
            disablePastDates
          />
          <InputField
            id="jobUrl"
            label="Job URL"
            type="url"
            value={jobUrl}
            onChange={(value) => {
              setJobUrl(value)
              handleFormChange({ jobUrl: value })
            }}
            placeholder="https://..."
          />
        </div>

        <div className="flex flex-col">
          <div className="flex items-center gap-1">
            <label htmlFor="jobDescription" className={LABEL_BASE}>
              Job Description
              {!requireJobDescription && (
                <span className="ml-1 text-gray-400 dark:text-gray-500">
                  (optional)
                </span>
              )}
            </label>
            <button
              type="button"
              onClick={textFileUpload.triggerFileDialog}
              className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-700 dark:hover:text-gray-300"
              title="Upload .md or .txt file"
            >
              <FileUp className="h-4 w-4" />
            </button>
            <input
              ref={textFileUpload.fileInputRef}
              type="file"
              accept={textFileUpload.acceptedFileTypes}
              onChange={textFileUpload.handleInputChange}
              className="sr-only"
            />
          </div>
          <div
            onDrop={textFileUpload.handleDrop}
            onDragOver={textFileUpload.handleDragOver}
            onDragLeave={textFileUpload.handleDragLeave}
            className={`rounded-lg transition-colors ${
              textFileUpload.isDragActive
                ? 'ring-2 ring-gray-400 dark:ring-gray-500'
                : ''
            }`}
          >
            <textarea
              id="jobDescription"
              name="jobDescription"
              value={jobDescription}
              onChange={(event) => {
                setJobDescription(event.target.value)
                handleFormChange({ jobDescription: event.target.value })
              }}
              placeholder="Paste the job description here..."
              rows={8}
              className={`${INPUT_TEXTAREA} overflow-y-auto`}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

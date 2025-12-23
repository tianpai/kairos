import { useState } from 'react'
import { InputField } from '@ui/InputField'
import { DatePicker } from '@ui/DatePicker'
import type { JobApplicationInput } from '@/api/jobs'
import { INPUT_TEXTAREA, LABEL_BASE } from '@/components/resumeForm/fieldStyles'

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

  const handleFormChange = (updates?: {
    jobDescription?: string
    companyName?: string
    position?: string
    dueDate?: string
  }) => {
    const currentJobDescription = updates?.jobDescription ?? jobDescription
    const currentCompanyName = updates?.companyName ?? companyName
    const currentPosition = updates?.position ?? position
    const currentDueDate = updates?.dueDate ?? dueDate

    const formData: JobApplicationFormData = {
      jobDescription: currentJobDescription.trim(),
      companyName: currentCompanyName.trim(),
      position: currentPosition.trim(),
      dueDate: currentDueDate,
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
      <h2 className="text-lg font-semibold">Job details</h2>
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
        </div>

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

        <div className="flex flex-col">
          <label htmlFor="jobDescription" className={LABEL_BASE}>
            Job Description
            {!requireJobDescription && (
              <span className="ml-1 text-gray-400 dark:text-gray-500">
                (optional)
              </span>
            )}
          </label>
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
            className={`${INPUT_TEXTAREA} !overflow-y-auto`}
          />
        </div>
      </div>
    </section>
  )
}

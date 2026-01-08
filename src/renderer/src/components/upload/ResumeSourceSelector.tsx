export type ResumeSource = 'upload' | 'existing' | 'scratch'

interface ResumeSourceSelectorProps {
  value: ResumeSource
  onChange: (source: ResumeSource) => void
}

const options: Array<{ value: ResumeSource; label: string }> = [
  { value: 'upload', label: 'Upload resume' },
  { value: 'existing', label: 'Use existing' },
  { value: 'scratch', label: 'From scratch' },
]

export function ResumeSourceSelector({
  value,
  onChange,
}: ResumeSourceSelectorProps) {
  return (
    <div className="flex rounded-lg border border-default bg-surface p-0.5">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-base text-primary shadow-sm'
              : 'text-secondary hover:text-primary'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

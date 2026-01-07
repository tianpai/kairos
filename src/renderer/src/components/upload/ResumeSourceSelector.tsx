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
    <div className="flex rounded-lg border border-gray-200 bg-gray-100 p-0.5 dark:border-gray-700 dark:bg-gray-800">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
            value === option.value
              ? 'bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100'
              : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

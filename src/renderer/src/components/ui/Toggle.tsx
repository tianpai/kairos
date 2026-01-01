interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  labelOn?: string
  labelOff?: string
  disabled?: boolean
}

export function Toggle({
  checked,
  onChange,
  labelOn,
  labelOff,
  disabled = false,
}: ToggleProps) {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      handleToggle()
    }
  }

  return (
    <div className="flex items-center gap-3">
      {labelOff && (
        <span
          className={`text-sm ${
            !checked
              ? 'font-medium text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {labelOff}
        </span>
      )}
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={handleToggle}
        onKeyDown={handleKeyDown}
        className={`relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:outline-none dark:focus:ring-offset-gray-900 ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        } ${
          checked ? 'bg-black dark:bg-white' : 'bg-gray-300 dark:bg-gray-600'
        }`}
      >
        <span
          className={`inline-block h-3 w-3 transform rounded-full bg-white shadow transition-transform duration-200 dark:bg-gray-900 ${
            checked ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
      {labelOn && (
        <span
          className={`text-sm ${
            checked
              ? 'font-medium text-gray-900 dark:text-gray-100'
              : 'text-gray-500 dark:text-gray-400'
          }`}
        >
          {labelOn}
        </span>
      )}
    </div>
  )
}

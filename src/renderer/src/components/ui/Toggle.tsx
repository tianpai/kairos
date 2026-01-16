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
        <span className={`text-sm ${!checked ? 'text-primary' : 'text-hint'}`}>
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
        className={`focus:ring-default relative inline-flex h-4 w-8 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus:ring-2 focus:ring-offset-2 focus:outline-none ${
          disabled ? 'cursor-not-allowed opacity-50' : ''
        } ${checked ? 'bg-active' : 'bg-primary'}`}
      >
        <span
          className={`bg-base inline-block h-3 w-3 transform rounded-full shadow transition-transform duration-200 ${
            checked ? 'translate-x-4' : 'translate-x-1'
          }`}
        />
      </button>
      {labelOn && (
        <span className={`text-sm ${checked ? 'text-primary' : 'text-hint'}`}>
          {labelOn}
        </span>
      )}
    </div>
  )
}

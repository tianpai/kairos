import { INPUT_BASE, LABEL_BASE } from '@/components/resumeForm/fieldStyles'

interface InputFieldProps {
  id: string
  label: string
  type: 'text' | 'date' | 'email' | 'number' | 'tel'
  placeholder?: string
  value: string
  onChange: (value: string) => void
}

export function InputField({
  id,
  label,
  type,
  value,
  onChange,
  placeholder,
}: InputFieldProps) {
  return (
    <div>
      <label htmlFor={id} className={LABEL_BASE}>
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`${INPUT_BASE} ${type === 'date' && !value ? 'text-gray-400' : ''}`}
        style={type === 'date' && !value ? { colorScheme: 'light' } : undefined}
      />
    </div>
  )
}

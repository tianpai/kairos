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
      <label htmlFor={id} className="mb-1 block text-sm font-medium">
        {label}
      </label>
      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full border-b border-gray-400 bg-transparent px-3 py-2 focus:border-b focus:border-black focus:outline-none dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-white ${
          type === 'date' && !value ? 'text-gray-400' : ''
        }`}
        style={type === 'date' && !value ? { colorScheme: 'light' } : undefined}
      />
    </div>
  )
}

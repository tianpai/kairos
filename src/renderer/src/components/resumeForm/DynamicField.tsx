import { InvertedButton } from '@ui/InvertedButton'
import { DateInput } from '@ui/DateInput'
import type { FieldSchema, FieldValue } from '@templates/template.types'

interface DynamicFieldProps {
  schema: FieldSchema
  value: FieldValue
  onChange: (value: FieldValue) => void
}

interface FieldWrapperProps {
  label: string
  htmlFor?: string
  children: React.ReactNode
}

function FieldWrapper({ label, htmlFor, children }: FieldWrapperProps) {
  return (
    <div className="mb-2">
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium">
        {label}
      </label>
      {children}
    </div>
  )
}

function TextArrayField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string
  placeholder?: string
  value: FieldValue
  onChange: (value: Array<string>) => void
}) {
  const items = Array.isArray(value) ? value : []

  const updateItem = (index: number, newValue: string) => {
    const updated = [...items]
    updated[index] = newValue
    onChange(updated)
  }

  const addItem = () => onChange([...items, ''])

  const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const textareaRef = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto'
      element.style.height = `${element.scrollHeight}px`
    }
  }

  return (
    <FieldWrapper label={label}>
      <div className="space-y-1.5">
        {items.map((item: string, index: number) => (
          <div key={index}>
            <textarea
              ref={textareaRef}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              onInput={handleTextareaInput}
              placeholder={placeholder}
              rows={1}
              className="w-full resize-none overflow-hidden border-b border-gray-400 px-3 py-2 text-xs focus:border-b focus:border-black focus:outline-none"
            />
          </div>
        ))}
        <div className="text-right">
          <InvertedButton
            type="button"
            onClick={addItem}
            bgColor="bg-white"
            textColor="text-black"
            hoverBgColor="hover:bg-black"
            hoverTextColor="hover:text-white"
            className="border border-black text-xs"
          >
            Add {label}
          </InvertedButton>
        </div>
      </div>
    </FieldWrapper>
  )
}

export function DynamicField({ schema, value, onChange }: DynamicFieldProps) {
  const { key, label, type, placeholder, options } = schema

  if (type === 'text-array') {
    return (
      <TextArrayField
        label={label}
        placeholder={placeholder}
        value={value}
        onChange={onChange as (value: Array<string>) => void}
      />
    )
  }

  const stringValue = typeof value === 'string' ? value : ''

  if (type === 'select') {
    return (
      <FieldWrapper label={label} htmlFor={key}>
        <select
          id={key}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border-b border-gray-400 px-3 py-2 text-sm focus:border-b focus:border-black focus:outline-none"
        >
          {options?.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </FieldWrapper>
    )
  }

  if (type === 'textarea') {
    const handleTextareaInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      const textarea = e.currentTarget
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }

    const textareaRef = (element: HTMLTextAreaElement | null) => {
      if (element) {
        element.style.height = 'auto'
        element.style.height = `${element.scrollHeight}px`
      }
    }

    return (
      <FieldWrapper label={label} htmlFor={key}>
        <textarea
          id={key}
          ref={textareaRef}
          value={stringValue}
          onChange={(e) => onChange(e.target.value)}
          onInput={handleTextareaInput}
          placeholder={placeholder}
          rows={1}
          className="w-full resize-none overflow-hidden border-b border-gray-400 px-3 py-2 text-sm focus:border-b focus:border-black focus:outline-none"
        />
      </FieldWrapper>
    )
  }

  if (type === 'date') {
    return (
      <DateInput
        id={key}
        label={label}
        value={stringValue}
        onChange={(value) => onChange(value)}
      />
    )
  }

  return (
    <FieldWrapper label={label} htmlFor={key}>
      <input
        id={key}
        type={type}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border-b border-gray-400 px-3 py-2 text-xs focus:border-b focus:border-black focus:outline-none"
      />
    </FieldWrapper>
  )
}

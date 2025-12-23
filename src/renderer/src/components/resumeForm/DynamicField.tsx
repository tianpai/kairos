import { CircleX } from 'lucide-react'
import { InvertedButton } from '@ui/InvertedButton'
import { DateInput } from './DateInput'
import { asString, asStringArray } from './fieldUtils'
import { INPUT_BASE, INPUT_TEXTAREA, LABEL_BASE } from './fieldStyles'
import type { FieldSchema, FieldValue } from '@templates/template.types'

interface FieldProps {
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
      <label htmlFor={htmlFor} className={LABEL_BASE}>
        {label}
      </label>
      {children}
    </div>
  )
}

function useAutoResizeTextarea() {
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget
    textarea.style.height = 'auto'
    textarea.style.height = `${textarea.scrollHeight}px`
  }

  const ref = (element: HTMLTextAreaElement | null) => {
    if (element) {
      element.style.height = 'auto'
      element.style.height = `${element.scrollHeight}px`
    }
  }

  return { ref, handleInput }
}

function TextArrayField({ schema, value, onChange }: FieldProps) {
  const { label, placeholder } = schema
  const items = asStringArray(value)
  const { ref, handleInput } = useAutoResizeTextarea()

  const updateItem = (index: number, newValue: string) => {
    const updated = [...items]
    updated[index] = newValue
    onChange(updated)
  }

  const addItem = () => onChange([...items, ''])

  const removeItem = (index: number) => {
    const updated = items.filter((_, i) => i !== index)
    onChange(updated)
  }

  return (
    <FieldWrapper label={label}>
      <div className="space-y-1.5">
        {items.map((item: string, index: number) => (
          <div key={index} className="group relative">
            <textarea
              ref={ref}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              onInput={handleInput}
              placeholder={placeholder}
              rows={1}
              className={`${INPUT_TEXTAREA} pr-8`}
            />
            <button
              type="button"
              onClick={() => removeItem(index)}
              className="absolute right-2 top-2 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
            >
              <CircleX
                size={14}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
              />
            </button>
          </div>
        ))}
        <div className="text-right">
          <InvertedButton type="button" onClick={addItem}>
            <p className="text-xs"> Add {label} </p>
          </InvertedButton>
        </div>
      </div>
    </FieldWrapper>
  )
}

function SelectField({ schema, value, onChange }: FieldProps) {
  const { key, label, options } = schema

  return (
    <FieldWrapper label={label} htmlFor={key}>
      <select
        id={key}
        value={asString(value)}
        onChange={(e) => onChange(e.target.value)}
        className={INPUT_BASE}
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

function TextareaField({ schema, value, onChange }: FieldProps) {
  const { key, label, placeholder } = schema
  const { ref, handleInput } = useAutoResizeTextarea()

  return (
    <FieldWrapper label={label} htmlFor={key}>
      <textarea
        id={key}
        ref={ref}
        value={asString(value)}
        onChange={(e) => onChange(e.target.value)}
        onInput={handleInput}
        placeholder={placeholder}
        rows={1}
        className={INPUT_TEXTAREA}
      />
    </FieldWrapper>
  )
}

function DateField({ schema, value, onChange }: FieldProps) {
  const { key, label } = schema

  return (
    <FieldWrapper label={label} htmlFor={key}>
      <DateInput
        id={key}
        value={asString(value)}
        onChange={(val) => onChange(val)}
      />
    </FieldWrapper>
  )
}

function TextField({ schema, value, onChange }: FieldProps) {
  const { key, label, type, placeholder } = schema

  return (
    <FieldWrapper label={label} htmlFor={key}>
      <input
        id={key}
        type={type}
        value={asString(value)}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={INPUT_BASE}
      />
    </FieldWrapper>
  )
}

const FIELD_COMPONENTS: Record<string, React.ComponentType<FieldProps>> = {
  'text-array': TextArrayField,
  select: SelectField,
  textarea: TextareaField,
  date: DateField,
  text: TextField,
}

export function DynamicField({ schema, value, onChange }: FieldProps) {
  const Component = FIELD_COMPONENTS[schema.type] ?? TextField
  return <Component schema={schema} value={value} onChange={onChange} />
}

import { InvertedButton } from '@ui/InvertedButton'
import { DateInput } from '@ui/DateInput'
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
      <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium">
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
  const items = Array.isArray(value) ? value : []
  const { ref, handleInput } = useAutoResizeTextarea()

  const updateItem = (index: number, newValue: string) => {
    const updated = [...items]
    updated[index] = newValue
    onChange(updated)
  }

  const addItem = () => onChange([...items, ''])

  return (
    <FieldWrapper label={label}>
      <div className="space-y-1.5">
        {items.map((item: string, index: number) => (
          <div key={index}>
            <textarea
              ref={ref}
              value={item}
              onChange={(e) => updateItem(index, e.target.value)}
              onInput={handleInput}
              placeholder={placeholder}
              rows={1}
              className="w-full resize-none overflow-hidden border-b border-gray-400 px-3 py-2 text-xs focus:border-b focus:border-black focus:outline-none"
            />
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
  const stringValue = typeof value === 'string' ? value : ''

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

function TextareaField({ schema, value, onChange }: FieldProps) {
  const { key, label, placeholder } = schema
  const stringValue = typeof value === 'string' ? value : ''
  const { ref, handleInput } = useAutoResizeTextarea()

  return (
    <FieldWrapper label={label} htmlFor={key}>
      <textarea
        id={key}
        ref={ref}
        value={stringValue}
        onChange={(e) => onChange(e.target.value)}
        onInput={handleInput}
        placeholder={placeholder}
        rows={1}
        className="w-full resize-none overflow-hidden border-b border-gray-400 px-3 py-2 text-sm focus:border-b focus:border-black focus:outline-none"
      />
    </FieldWrapper>
  )
}

function DateField({ schema, value, onChange }: FieldProps) {
  const { key, label } = schema
  const stringValue = typeof value === 'string' ? value : ''

  return (
    <DateInput
      id={key}
      label={label}
      value={stringValue}
      onChange={(val) => onChange(val)}
    />
  )
}

function TextField({ schema, value, onChange }: FieldProps) {
  const { key, label, type, placeholder } = schema
  const stringValue = typeof value === 'string' ? value : ''

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

import { CircleX, GripVertical } from 'lucide-react'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button } from '@ui/Button'
import { Select } from '@ui/Select'
import { DateInput } from './DateInput'
import { asString, asStringArray } from './fieldUtils'
import { INPUT_BASE, INPUT_TEXTAREA, LABEL_BASE } from './fieldStyles'
import type { DragEndEvent } from '@dnd-kit/core'
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

interface SortableTextItemProps {
  id: string
  value: string
  placeholder?: string
  onUpdate: (value: string) => void
  onRemove: () => void
}

function SortableTextItem({
  id,
  value,
  placeholder,
  onUpdate,
  onRemove,
}: SortableTextItemProps) {
  const { ref: textareaRef, handleInput } = useAutoResizeTextarea()
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className="group relative flex items-start"
    >
      <button
        type="button"
        {...listeners}
        className="mt-2.5 cursor-grab text-hint opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
      >
        <GripVertical size={12} />
      </button>
      <div className="relative flex-1">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onUpdate(e.target.value)}
          onInput={handleInput}
          placeholder={placeholder}
          rows={1}
          className={`${INPUT_TEXTAREA} pr-8`}
        />
        <button
          type="button"
          onClick={onRemove}
          className="absolute right-2 top-2 p-0.5 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
        >
          <CircleX
            size={14}
            className="text-hint hover:text-secondary"
          />
        </button>
      </div>
    </div>
  )
}

function TextArrayField({ schema, value, onChange }: FieldProps) {
  const { label, placeholder } = schema
  const items = asStringArray(value)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const itemIds = items.map((_, index) => `item-${index}`)

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

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (over && active.id !== over.id) {
      const oldIndex = itemIds.indexOf(active.id as string)
      const newIndex = itemIds.indexOf(over.id as string)
      const newOrder = arrayMove(items, oldIndex, newIndex)
      onChange(newOrder)
    }
  }

  return (
    <FieldWrapper label={label}>
      <div className="space-y-1.5">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={itemIds}
            strategy={verticalListSortingStrategy}
          >
            {items.map((item: string, index: number) => (
              <SortableTextItem
                key={itemIds[index]}
                id={itemIds[index]}
                value={item}
                placeholder={placeholder}
                onUpdate={(newValue) => updateItem(index, newValue)}
                onRemove={() => removeItem(index)}
              />
            ))}
          </SortableContext>
        </DndContext>
        <div className="text-right">
          <Button type="button" onClick={addItem}>
            <p className="text-xs"> Add {label} </p>
          </Button>
        </div>
      </div>
    </FieldWrapper>
  )
}

function SelectField({ schema, value, onChange }: FieldProps) {
  const { key, label, options } = schema

  return (
    <FieldWrapper label={label} htmlFor={key}>
      <Select
        id={key}
        value={asString(value)}
        onChange={(e) => onChange(e.target.value)}
        className="w-full"
      >
        {options?.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </Select>
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

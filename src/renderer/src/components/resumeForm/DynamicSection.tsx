import { useResumeStore } from '@typst-compiler/resumeState'
import { CircleX, Plus } from 'lucide-react'
import { DynamicField } from './DynamicField'
import type {
  FieldSchema,
  FieldValue,
  SectionEntry,
  SectionUISchema,
} from '@templates/template.types'

interface DynamicSectionProps {
  schema: SectionUISchema
}

function SectionWrapper({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 p-2">{children}</div>
}

interface FieldListProps {
  fields: Array<FieldSchema>
  data: SectionEntry
  onFieldChange: (fieldKey: string, value: FieldValue) => void
}

function FieldList({ fields, data, onFieldChange }: FieldListProps) {
  return (
    <>
      {fields.map((field) => (
        <DynamicField
          key={field.key}
          schema={field}
          value={data[field.key]}
          onChange={(value) => onFieldChange(field.key, value)}
        />
      ))}
    </>
  )
}

interface EntryItemProps {
  label: string
  index: number
  fields: Array<FieldSchema>
  data: SectionEntry
  canRemove: boolean
  onFieldChange: (fieldKey: string, value: FieldValue) => void
  onRemove: () => void
}

function EntryItem({
  label,
  index,
  fields,
  data,
  canRemove,
  onFieldChange,
  onRemove,
}: EntryItemProps) {
  return (
    <div className="mb-2 p-2">
      <div className="mb-2 flex items-center justify-between">
        <h4 className="text-xs font-semibold">
          {label} #{index + 1}
        </h4>
        {canRemove && (
          <button
            type="button"
            onClick={onRemove}
            className="cursor-pointer p-1 hover:text-red-600"
          >
            <CircleX size={13} className="text-slate-500" />
          </button>
        )}
      </div>
      <FieldList fields={fields} data={data} onFieldChange={onFieldChange} />
    </div>
  )
}

interface SingleEntrySectionProps {
  schema: SectionUISchema
  data: SectionEntry
}

function SingleEntrySection({ schema, data }: SingleEntrySectionProps) {
  const updateField = useResumeStore((state) => state.updateField)
  const compile = useResumeStore((state) => state.compile)

  const handleFieldChange = (fieldKey: string, value: FieldValue) => {
    updateField(schema.id, null, fieldKey, value)
    compile()
  }

  return (
    <SectionWrapper>
      <FieldList
        fields={schema.fields}
        data={data}
        onFieldChange={handleFieldChange}
      />
    </SectionWrapper>
  )
}

interface MultipleEntrySectionProps {
  schema: SectionUISchema
  entries: Array<SectionEntry>
}

function MultipleEntrySection({ schema, entries }: MultipleEntrySectionProps) {
  const updateField = useResumeStore((state) => state.updateField)
  const addEntry = useResumeStore((state) => state.addEntry)
  const removeEntry = useResumeStore((state) => state.removeEntry)
  const compile = useResumeStore((state) => state.compile)

  const handleFieldChange = (
    index: number,
    fieldKey: string,
    value: FieldValue,
  ) => {
    updateField(schema.id, index, fieldKey, value)
    compile()
  }

  const handleRemove = (index: number) => {
    removeEntry(schema.id, index)
    compile()
  }

  const handleAdd = () => {
    addEntry(schema.id)
  }

  const canRemoveAny = !schema.required || entries.length > 1

  return (
    <SectionWrapper>
      <button
        type="button"
        onClick={handleAdd}
        className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-md py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Plus size={14} />
        <span>New</span>
      </button>

      {entries.length === 0 && (
        <p className="mb-2 text-xs text-gray-500 italic">
          No {schema.label.toLowerCase()} added yet.
        </p>
      )}

      {entries.map((entry: SectionEntry, index: number) => (
        <EntryItem
          key={(entry._id as string) || index}
          label={schema.label}
          index={index}
          fields={schema.fields}
          data={entry}
          canRemove={canRemoveAny || index !== entries.length - 1}
          onFieldChange={(fieldKey, value) =>
            handleFieldChange(index, fieldKey, value)
          }
          onRemove={() => handleRemove(index)}
        />
      ))}
    </SectionWrapper>
  )
}

export function DynamicSection({ schema }: DynamicSectionProps) {
  const data = useResumeStore((state) => state.data[schema.id])

  if (!data) {
    return null
  }

  if (!schema.multiple) {
    return <SingleEntrySection schema={schema} data={data as SectionEntry} />
  }

  return (
    <MultipleEntrySection
      schema={schema}
      entries={data as Array<SectionEntry>}
    />
  )
}

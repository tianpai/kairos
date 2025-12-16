import { useResumeStore } from '@typst-compiler/resumeState'
import { CircleX, Plus } from 'lucide-react'
import { InvertedCircleButton } from '@ui/InvertedCircleButton'
import { DynamicField } from './DynamicField'
import type {
  FieldSchema,
  FieldValue,
  SectionEntry,
  SectionUISchema,
} from '@templates/template.types'

interface DynamicSectionProps {
  schema: SectionUISchema
  hideTitle?: boolean
}

interface SectionWrapperProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
  hideTitle?: boolean
}

function SectionWrapper({
  title,
  children,
  action,
  hideTitle,
}: SectionWrapperProps) {
  return (
    <div className="mb-4">
      {!hideTitle && (
        <div className="flex items-center justify-between bg-black px-3 py-2">
          <h3 className="text-xs font-semibold text-gray-200">{title}</h3>
          {action && <div>{action}</div>}
        </div>
      )}
      <div className="p-2">{children}</div>
    </div>
  )
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

export function DynamicSection({ schema, hideTitle }: DynamicSectionProps) {
  const data = useResumeStore((state) => state.data[schema.id])
  const updateField = useResumeStore((state) => state.updateField)
  const addEntry = useResumeStore((state) => state.addEntry)
  const removeEntry = useResumeStore((state) => state.removeEntry)
  const compile = useResumeStore((state) => state.compile)

  const handleFieldChange = (
    index: number | null,
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

  // Handle case where data doesn't exist yet
  if (!data) {
    return null
  }

  if (!schema.multiple) {
    const sectionData = data as SectionEntry
    return (
      <SectionWrapper title={schema.label} hideTitle={hideTitle}>
        <FieldList
          fields={schema.fields}
          data={sectionData}
          onFieldChange={(fieldKey, value) =>
            handleFieldChange(null, fieldKey, value)
          }
        />
      </SectionWrapper>
    )
  }

  const entries = data as Array<SectionEntry>
  const canRemoveAny = !schema.required || entries.length > 1

  const addButton = hideTitle ? (
    <button
      type="button"
      onClick={handleAdd}
      className="flex w-full cursor-pointer items-center justify-center gap-1 rounded-md py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100"
    >
      <Plus size={14} />
      <span>New</span>
    </button>
  ) : (
    <InvertedCircleButton
      onClick={handleAdd}
      ariaLabel={`Add ${schema.label}`}
      variant="dark"
      bordered={false}
    >
      <Plus size={16} />
    </InvertedCircleButton>
  )

  return (
    <SectionWrapper
      title={schema.label}
      hideTitle={hideTitle}
      action={hideTitle ? undefined : addButton}
    >
      {hideTitle && addButton}

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

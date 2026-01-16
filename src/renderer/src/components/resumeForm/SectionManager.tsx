import { Fragment, memo, useCallback, useMemo, useState } from 'react'
import { GripVertical } from 'lucide-react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { useSectionManager } from '@hooks/useSectionManager'
import { getSectionLabel } from '@templates/builder'
import type { ReactNode } from 'react'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'

interface SectionCardProps {
  id: string
  label: string
  styleId: string
}

function SectionCard({ id, label, styleId }: SectionCardProps) {
  return (
    <>
      <div className="text-primary text-sm font-medium">{label}</div>
      <div className="text-hint text-xs">
        ID: {id} | Style: {styleId}
      </div>
    </>
  )
}

interface DraggableSectionProps {
  id: string
  label: string
  styleId: string
}

const DraggableSection = memo(function DraggableSection({
  id,
  label,
  styleId,
}: DraggableSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isOver,
    active,
  } = useSortable({ id })

  // Check if this item is currently being dragged
  const isDragging = active?.id === id

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  // Show drop indicator when dragging over this item
  const showDropIndicator = isOver && active && active.id !== id

  return (
    <div className="relative">
      {showDropIndicator && (
        <div className="bg-primary absolute -top-1 right-0 left-0 h-0.5" />
      )}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        className={`group border-default flex items-center rounded-md border p-2 transition-colors ${
          showDropIndicator ? 'mt-2' : ''
        } bg-surface`}
      >
        <button
          type="button"
          {...listeners}
          className="text-hint mr-1.5 cursor-grab opacity-0 transition-opacity group-hover:opacity-100 active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
        <div className="flex-1">
          <SectionCard id={id} label={label} styleId={styleId} />
        </div>
      </div>
    </div>
  )
})

interface SortableZoneProps<T> {
  id: string
  title: string
  items: Array<T>
  getItemId: (item: T) => string
  renderItem: (item: T) => ReactNode
  emptyMessage?: string
}

const SortableZone = memo(function SortableZone<T>({
  id,
  title,
  items,
  getItemId,
  renderItem,
  emptyMessage = 'List is empty',
}: SortableZoneProps<T>) {
  const { setNodeRef, isOver } = useDroppable({ id })
  const itemIds = useMemo(() => items.map(getItemId), [items, getItemId])
  const isEmpty = items.length === 0

  return (
    <div className="space-y-2">
      <div className="text-sm font-medium">{title}</div>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-25 space-y-2 rounded-md transition-colors ${
            isOver ? 'ring-default ring-2' : ''
          }`}
        >
          {isEmpty && !isOver && (
            <div className="border-default text-hint rounded-md border border-dashed p-4 text-center text-sm">
              {emptyMessage}
            </div>
          )}

          {items.map((item) => (
            <Fragment key={getItemId(item)}>{renderItem(item)}</Fragment>
          ))}
        </div>
      </SortableContext>
    </div>
  )
}) as <T>(props: SortableZoneProps<T>) => React.ReactElement

function CurrentSectionsZone({
  sections,
  schemaById,
}: {
  sections: Array<{ id: string; styleId: string }>
  schemaById: Record<string, { label: string }>
}) {
  return (
    <SortableZone
      id="current-zone"
      title="Current Sections (drag to reorder):"
      items={sections}
      getItemId={(section) => section.id}
      renderItem={(section) => (
        <DraggableSection
          id={section.id}
          label={schemaById[section.id].label}
          styleId={section.styleId}
        />
      )}
    />
  )
}

function AvailableSectionsZone({
  availableSections,
}: {
  availableSections: ReadonlyArray<string>
}) {
  return (
    <SortableZone
      id="available-zone"
      title="Available Sections:"
      items={[...availableSections]}
      getItemId={(id) => id}
      emptyMessage="All sections are added"
      renderItem={(sectionId) => (
        <DraggableSection
          id={sectionId}
          label={getSectionLabel(sectionId)}
          styleId="default"
        />
      )}
    />
  )
}

export function SectionManagerContent() {
  // Track active drag item
  const [activeId, setActiveId] = useState<string | null>(null)

  // Custom hook handles all business logic
  const {
    currentSections,
    availableSections,
    schemaById,
    handleDragEnd: handleDragEndLogic,
    getActiveItemLabel,
  } = useSectionManager()

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }, [])

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null)
      handleDragEndLogic(event)
    },
    [handleDragEndLogic],
  )

  return (
    <div>
      <div className="mb-4">
        <div className="text-lg font-medium">Sections</div>
        <div className="text-secondary mt-1 text-sm">
          Data will be lost if sections are removed (dragged out)
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-2 gap-4">
          {/* Current Sections Zone */}
          <CurrentSectionsZone
            sections={currentSections}
            schemaById={schemaById}
          />

          {/* Available Sections Zone */}
          <AvailableSectionsZone availableSections={availableSections} />
        </div>

        <DragOverlay>
          {activeId ? (
            <div className="border-default bg-surface flex items-center rounded-md border p-2 shadow-lg">
              <div className="text-hint mr-1.5 cursor-grabbing">
                <GripVertical size={16} />
              </div>
              <div className="flex-1">
                <SectionCard
                  id={activeId}
                  label={getActiveItemLabel(activeId)}
                  styleId="default"
                />
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

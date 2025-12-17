import { memo, useCallback, useMemo, useState } from 'react'
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
  inverted?: boolean
}

function SectionCard({
  id,
  label,
  styleId,
  inverted = false,
}: SectionCardProps) {
  return (
    <>
      <div
        className={`font-medium ${inverted ? 'text-gray-200' : 'text-black group-hover:text-gray-200 dark:text-gray-200'}`}
      >
        {label}
      </div>
      <div
        className={`text-sm ${inverted ? 'text-gray-200' : 'text-gray-500 group-hover:text-gray-200 dark:text-gray-400'}`}
      >
        ID: {id} | Style: {styleId}
      </div>
    </>
  )
}

interface DraggableSectionProps {
  id: string
  label: string
  styleId: string
  isDragOverlay?: boolean
}

const DraggableSection = memo(function DraggableSection({
  id,
  label,
  styleId,
  isDragOverlay,
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
    opacity: isDragging ? 0 : 1,
  }

  // Show drop indicator when dragging over this item
  const showDropIndicator =
    isOver && active && active.id !== id && !isDragOverlay

  return (
    <div className="relative">
      {showDropIndicator && (
        <div className="absolute -top-1 right-0 left-0 h-0.5 bg-black dark:bg-white" />
      )}
      <div
        ref={setNodeRef}
        style={style}
        {...attributes}
        {...listeners}
        className={`group cursor-move border p-3 transition-colors ${
          showDropIndicator ? 'mt-2' : ''
        } bg-white hover:border-black hover:bg-black dark:border-gray-600 dark:bg-[#2a2a2a] dark:hover:border-gray-400 dark:hover:bg-[#3a3a3a]`}
      >
        <SectionCard id={id} label={label} styleId={styleId} />
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
      <h3 className="font-medium dark:text-gray-200">{title}</h3>

      <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className={`min-h-25 space-y-2 transition-colors ${
            isOver ? 'ring-2 ring-gray-300' : ''
          }`}
        >
          {isEmpty && !isOver && (
            <div className="border border-dashed p-4 text-center text-sm text-gray-500 dark:border-gray-600 dark:text-gray-400">
              {emptyMessage}
            </div>
          )}

          {items.map((item) => renderItem(item))}
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
        <h3 className="text-lg font-medium dark:text-gray-200">Sections</h3>
        <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
          Data will be lost if sections are removed (dragged out)
        </p>
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
            <div className="cursor-move border bg-black p-3">
              <SectionCard
                id={activeId}
                label={getActiveItemLabel(activeId)}
                styleId="default"
                inverted={true}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  )
}

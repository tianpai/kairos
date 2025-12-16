import { useMemo } from 'react'
import { useResumeStore } from '@typst-compiler/resumeState'
import { arrayMove } from '@dnd-kit/sortable'
import type { DragEndEvent } from '@dnd-kit/core'
import { TemplateBuilder, getSectionLabel } from '@templates/builder'
import { TemplateId } from '@templates/templateId'
import { SECTION_IDS } from '@templates/template.types'

export function useSectionManager() {
  // Store selectors
  const templateId = useResumeStore((state) => state.templateId)
  const reorderSections = useResumeStore((state) => state.reorderSections)
  const addSection = useResumeStore((state) => state.addSection)
  const insertSectionAt = useResumeStore((state) => state.insertSectionAt)
  const removeSection = useResumeStore((state) => state.removeSection)

  // Memoize expensive template parsing and building
  const config = useMemo(() => TemplateId.parse(templateId), [templateId])
  const builder = useMemo(() => new TemplateBuilder(templateId), [templateId])
  const schemas = useMemo(() => builder.getUISchemas(), [builder])

  // Create a lookup map for schema by ID
  const schemaById = useMemo(
    () => Object.fromEntries(schemas.map((s) => [s.id, s])),
    [schemas],
  )

  // Calculate available sections
  const availableSections = useMemo(() => {
    const allSectionIds = Object.values(SECTION_IDS)
    const currentSectionIds = config.sections.map((s) => s.id)
    return allSectionIds.filter((id) => !currentSectionIds.includes(id))
  }, [config.sections])

  // Drag and drop handler
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) return

    const draggedId = active.id as string
    const overId = over.id as string

    // Check if dragged item was in available or current
    const wasAvailable = (availableSections as ReadonlyArray<string>).includes(
      draggedId,
    )
    const wasInCurrent = config.sections.some((s) => s.id === draggedId)

    // Check what zone we're dropping into
    const droppedOnAvailableZone = overId === 'available-zone'
    const droppedOnCurrentZone = overId === 'current-zone'
    const droppedOnCurrentItem = config.sections.some((s) => s.id === overId)

    if (wasAvailable && (droppedOnCurrentZone || droppedOnCurrentItem)) {
      // Available → Current: add section at the dropped position
      if (droppedOnCurrentItem) {
        // Insert atomically at the target position
        const targetIndex = config.sections.findIndex((s) => s.id === overId)
        insertSectionAt(draggedId, targetIndex)
      } else {
        // Drop on zone: append to end
        addSection(draggedId)
      }
    } else if (wasInCurrent && droppedOnAvailableZone) {
      // Current → Available: remove section
      removeSection(draggedId)
    } else if (wasInCurrent && droppedOnCurrentItem) {
      // Current → Current: reorder
      if (active.id !== over.id) {
        const oldIndex = config.sections.findIndex((s) => s.id === active.id)
        const newIndex = config.sections.findIndex((s) => s.id === over.id)

        const newOrder = arrayMove(config.sections, oldIndex, newIndex).map(
          (s) => s.id,
        )
        reorderSections(newOrder)
      }
    }
  }

  // Get label for active dragging item
  const getActiveItemLabel = (activeId: string | null) => {
    if (!activeId) return ''
    const section = config.sections.find((s) => s.id === activeId)
    if (section) {
      return schemaById[section.id].label
    }
    return getSectionLabel(activeId)
  }

  return {
    currentSections: config.sections,
    availableSections,
    schemaById,
    handleDragEnd,
    getActiveItemLabel,
  }
}

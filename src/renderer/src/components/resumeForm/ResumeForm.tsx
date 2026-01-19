import { useEffect, useState } from 'react'
import { useResumeStore } from '@typst-compiler/resumeState'
import { Button } from '@ui/Button'
import { Tooltip } from '@ui/Tooltip'
import { DynamicSection } from '@/components/resumeForm/DynamicSection'
import { TemplateBuilder } from '@/templates/builder'
import { TemplateId } from '@/templates/templateId'

export default function ResumeForm() {
  const templateId = useResumeStore((state) => state.templateId)
  const config = TemplateId.parse(templateId)
  const builder = new TemplateBuilder(templateId)
  const schemas = builder.getUISchemas()

  // Create a lookup map for schema by ID
  const schemaById = Object.fromEntries(schemas.map((s) => [s.id, s]))

  // Get section order from config
  const sectionOrder = config.sections.map((s) => s.id)

  // Active tab state - default to first section
  const [activeTab, setActiveTab] = useState<string>(sectionOrder[0] || '')

  // Handle case when active tab's section is removed
  useEffect(() => {
    if (sectionOrder.length > 0 && !sectionOrder.includes(activeTab)) {
      setActiveTab(sectionOrder[0])
    }
  }, [sectionOrder, activeTab])

  const activeSectionSchema = schemaById[activeTab]

  return (
    <div className="flex h-full">
      {/* Section Navigation - Vertical on left */}
      <div className="bg-app-header my-2 ml-2 flex flex-col gap-1 rounded-lg p-2">
        {sectionOrder.map((sectionId) => {
          const schema = schemaById[sectionId]
          const Icon = schema.icon
          return (
            <Tooltip key={sectionId} content={schema.label} side="right">
              <Button
                variant="icon"
                active={activeTab === sectionId}
                onClick={() => setActiveTab(sectionId)}
              >
                <Icon size={16} />
              </Button>
            </Tooltip>
          )
        })}
      </div>

      {/* Active Section Content */}
      <div className="flex-1 overflow-y-auto">
        {activeSectionSchema && (
          <DynamicSection key={activeTab} schema={activeSectionSchema} />
        )}
      </div>
    </div>
  )
}

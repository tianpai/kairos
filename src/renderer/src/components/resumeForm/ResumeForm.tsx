import { useEffect, useState } from 'react'
import { useResumeStore } from '@typst-compiler/resumeState'
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
    <div className="flex h-full flex-col">
      {/* Vertical Tab Navigation */}
      <div className="bg-app-header m-2 flex flex-col rounded-lg p-2">
        {sectionOrder.map((sectionId) => {
          const schema = schemaById[sectionId]
          return (
            <button
              key={sectionId}
              type="button"
              onClick={() => setActiveTab(sectionId)}
              className={`w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                activeTab === sectionId
                  ? 'bg-gray-200 font-medium text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                  : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800'
              }`}
            >
              {schema.label}
            </button>
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

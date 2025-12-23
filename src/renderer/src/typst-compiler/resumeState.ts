import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { compileToSVG } from '@typst-compiler/compile'
import { TemplateBuilder } from '@templates/builder'
import {
  DEFAULT_TEMPLATE_NAME,
  premadeTemplates,
} from '@templates/premade-tmpl'
import { TemplateId } from '@templates/templateId'
import type {
  FieldValue,
  SectionEntry,
  TemplateData,
} from '@templates/template.types'
import type { DocumentSetup } from '@templates/shared/document-config'

interface ResumeState {
  templateId: string // JSON string of TemplateConfig (editable copy)
  data: TemplateData
  svgOutput: string

  updateField: (
    sectionId: string,
    index: number | null,
    field: string,
    value: FieldValue,
  ) => void
  loadParsedResume: (parsedData: TemplateData) => void

  // entry is within a section
  addEntry: (sectionId: string) => void
  removeEntry: (sectionId: string, index: number) => void
  reorderEntries: (sectionId: string, oldIndex: number, newIndex: number) => void

  // sections are like work experiences, education
  addSection: (sectionId: string, styleId?: string) => void
  insertSectionAt: (sectionId: string, index: number, styleId?: string) => void
  removeSection: (sectionId: string) => void

  reorderSections: (newOrder: Array<string>) => void

  updateGlobalConfig: (key: keyof DocumentSetup, value: string) => void

  compile: () => Promise<void>
}

// Get initial template from the default template
const defaultTemplateId = TemplateId.toJSON(
  premadeTemplates[DEFAULT_TEMPLATE_NAME],
)

export const useResumeStore = create<ResumeState>()(
  persist(
    (set, get) => ({
      templateId: defaultTemplateId,
      data: new TemplateBuilder(defaultTemplateId).getDefaults(),
      svgOutput: '',

      updateField: (sectionId, index, field, value) => {
        set((state) => {
          const newData: TemplateData = { ...state.data }
          const sectionData = newData[sectionId]
          if (index === null) {
            // Single object section
            const singleEntry = sectionData as SectionEntry
            newData[sectionId] = {
              ...singleEntry,
              [field]: value,
            }
          } else {
            // Array section
            const arrayData = sectionData as Array<SectionEntry>
            const updatedArray = [...arrayData]
            updatedArray[index] = {
              ...arrayData[index],
              [field]: value,
            }
            newData[sectionId] = updatedArray
          }
          return { data: newData }
        })
      },

      addEntry: (sectionId) => {
        set((state) => {
          const builder = new TemplateBuilder(state.templateId)
          const schema = builder.getUISchemas().find((s) => s.id === sectionId)
          if (!schema || !schema.multiple) {
            console.error(`Section ${sectionId} is not an array section`)
            return state
          }
          // Create empty entry with all fields and a unique ID for React key
          const emptyEntry: SectionEntry = {
            _id: crypto.randomUUID(),
          }
          schema.fields.forEach((field) => {
            if (field.type === 'text-array') {
              emptyEntry[field.key] = []
            } else {
              emptyEntry[field.key] = ''
            }
          })
          const newData: TemplateData = { ...state.data }
          const currentArray = newData[sectionId] as Array<SectionEntry>
          newData[sectionId] = [emptyEntry, ...currentArray]
          return { data: newData }
        })
      },

      removeEntry: (sectionId, index) => {
        set((state) => {
          const newData: TemplateData = { ...state.data }
          const currentArray = newData[sectionId]
          if (!Array.isArray(currentArray)) {
            console.error(`Section ${sectionId} is not an array`)
            return state
          }
          newData[sectionId] = currentArray.filter((_, i) => i !== index)
          return { data: newData }
        })
      },

      reorderEntries: (sectionId, oldIndex, newIndex) => {
        set((state) => {
          const newData: TemplateData = { ...state.data }
          const currentArray = newData[sectionId]
          if (!Array.isArray(currentArray)) {
            console.error(`Section ${sectionId} is not an array`)
            return state
          }
          const reordered = [...currentArray]
          const [removed] = reordered.splice(oldIndex, 1)
          reordered.splice(newIndex, 0, removed)
          newData[sectionId] = reordered
          return { data: newData }
        })
        get()
          .compile()
          .catch((error) => {
            console.error(
              'Failed to compile resume after reordering entries',
              error,
            )
          })
      },

      compile: async () => {
        try {
          const { templateId, data } = get()
          const builder = new TemplateBuilder(templateId)
          const typstCode = builder.build(data)
          const svg = await compileToSVG(typstCode)
          set({ svgOutput: svg })
        } catch (error) {
          console.error('Failed to compile resume', error)
          set({ svgOutput: '' })
        }
      },

      loadParsedResume: (parsedData: TemplateData) => {
        set((state) => {
          const builder = new TemplateBuilder(state.templateId)
          const defaults = builder.getDefaults()
          const mergedData: TemplateData = { ...defaults }
          // merging parsed resume data with template defaults
          Object.entries(parsedData).forEach(([sectionId, value]) => {
            const defaultValue = defaults[sectionId]
            if (!Array.isArray(value) && !Array.isArray(defaultValue)) {
              mergedData[sectionId] = {
                ...defaultValue,
                ...value,
              }
            } else {
              mergedData[sectionId] = value
            }
          })

          // Clean up templateId: remove sections with empty data
          const config = TemplateId.parse(state.templateId)
          config.sections = config.sections.filter((section) => {
            const data = mergedData[section.id]

            // Array section: keep if has at least one entry
            if (Array.isArray(data)) {
              return data.length > 0
            }

            // Object section: keep if has at least one non-empty value
            return Object.values(data).some((value) =>
              Array.isArray(value) ? value.length > 0 : value !== '',
            )
          })

          const cleanedTemplateId = TemplateId.toJSON(config)

          return {
            templateId: cleanedTemplateId,
            data: mergedData,
          }
        })
        get()
          .compile()
          .catch((error) => {
            console.error(
              'Failed to compile resume after loading parsed data',
              error,
            )
          })
      },

      reorderSections: (newOrder: Array<string>) => {
        set((state) => {
          const config = TemplateId.parse(state.templateId)
          const reorderedSections = newOrder
            .map((id) => config.sections.find((s) => s.id === id))
            .filter((s) => s !== undefined)
          config.sections = reorderedSections
          return { templateId: TemplateId.toJSON(config) }
        })
        get()
          .compile()
          .catch((error) => {
            console.error(
              'Failed to compile resume after reordering sections',
              error,
            )
          })
      },

      addSection: (sectionId: string, styleId: string = 'default') => {
        set((state) => {
          const config = TemplateId.parse(state.templateId)
          // Check if section already exists
          if (config.sections.some((s) => s.id === sectionId)) {
            console.warn(`Section ${sectionId} already exists`)
            return state
          }
          config.sections.push({ id: sectionId, styleId })
          const newTemplateId = TemplateId.toJSON(config)
          // Add default data for the new section
          const builder = new TemplateBuilder(newTemplateId)
          const defaults = builder.getDefaults()
          const newData = {
            ...state.data,
            [sectionId]: defaults[sectionId],
          }
          return { templateId: newTemplateId, data: newData }
        })
        get()
          .compile()
          .catch((error) => {
            console.error(
              'Failed to compile resume after adding section',
              error,
            )
          })
      },

      insertSectionAt: (
        sectionId: string,
        index: number,
        styleId: string = 'default',
      ) => {
        set((state) => {
          const config = TemplateId.parse(state.templateId)
          // Check if section already exists
          if (config.sections.some((s) => s.id === sectionId)) {
            console.warn(`Section ${sectionId} already exists`)
            return state
          }
          // Insert at specific index
          config.sections.splice(index, 0, { id: sectionId, styleId })
          const newTemplateId = TemplateId.toJSON(config)
          // Add default data for the new section
          const builder = new TemplateBuilder(newTemplateId)
          const defaults = builder.getDefaults()
          const newData = {
            ...state.data,
            [sectionId]: defaults[sectionId],
          }
          return { templateId: newTemplateId, data: newData }
        })
        get()
          .compile()
          .catch((error) => {
            console.error(
              'Failed to compile resume after inserting section',
              error,
            )
          })
      },

      removeSection: (sectionId: string) => {
        set((state) => {
          const config = TemplateId.parse(state.templateId)
          config.sections = config.sections.filter((s) => s.id !== sectionId)
          const newTemplateId = TemplateId.toJSON(config)
          // Remove data for the removed section
          const newData = { ...state.data }
          delete newData[sectionId]
          return { templateId: newTemplateId, data: newData }
        })
        get()
          .compile()
          .catch((error) => {
            console.error(
              'Failed to compile resume after removing section',
              error,
            )
          })
      },

      updateGlobalConfig: (key: keyof DocumentSetup, value: string) => {
        set((state) => {
          const config = TemplateId.parse(state.templateId)
          // Update the specific global config field
          config.globalConfig = {
            ...config.globalConfig,
            [key]: value,
          }
          return { templateId: TemplateId.toJSON(config) }
        })
        get()
          .compile()
          .catch((error) => {
            console.error(
              'Failed to compile resume after updating global config',
              error,
            )
          })
      },
    }),
    {
      name: 'resume-editor-state',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        templateId: state.templateId,
        data: state.data,
      }),
      onRehydrateStorage: () => (state) => {
        if (!state) {
          return
        }
        // Recompile once state has been restored
        state
          .compile()
          .catch((error) =>
            console.error('Failed to compile resume after hydration', error),
          )
      },
    },
  ),
)

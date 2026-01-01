import { TemplateId } from '@templates/templateId'
import { SECTION_IDS } from '@templates/template.types'
import { GlobalHelpersSection } from '@templates/shared/document-config'

import {
  CertificatesSection,
  EducationSection,
  ExtracurricularsSection,
  PersonalInfoSection,
  ProjectsSection,
  SkillsSection,
  SummarySection,
  WorkExperienceSection,
} from '@templates/sections'
import type { TemplateConfig } from '@templates/templateId'
import type { Section, TemplateData } from '@templates/template.types'
import type { z } from 'zod'

/**
 * Section registry: maps section IDs to their class constructors
 */
type SectionConstructor = new (styleId: string) => Section

export const SECTION_REGISTRY: Partial<Record<string, SectionConstructor>> = {
  [SECTION_IDS.PERSONAL_INFO]: PersonalInfoSection,
  [SECTION_IDS.EDUCATION]: EducationSection,
  [SECTION_IDS.WORK_EXPERIENCE]: WorkExperienceSection,
  [SECTION_IDS.PROJECTS]: ProjectsSection,
  [SECTION_IDS.SKILLS]: SkillsSection,
  [SECTION_IDS.CERTIFICATES]: CertificatesSection,
  [SECTION_IDS.EXTRACURRICULARS]: ExtracurricularsSection,
  [SECTION_IDS.SUMMARY]: SummarySection,
}

/**
 * Get the label for a section by its ID
 */
export function getSectionLabel(sectionId: string): string {
  const SectionClass = SECTION_REGISTRY[sectionId]!
  const instance = new SectionClass('default')
  return instance.getUISchema().label
}

export class TemplateBuilder {
  private config: TemplateConfig
  private sections: Map<string, Section> = new Map()
  // Global helpers (document config) - stored separately, NOT included in schemas for AI
  private globalHelpers: GlobalHelpersSection

  constructor(templateId: string) {
    this.config = TemplateId.parse(templateId)
    // Initialize global helpers with document config (frontend-only, not sent to AI)
    this.globalHelpers = new GlobalHelpersSection(this.config.globalConfig)

    // Initialize sections based on config
    for (const sectionConfig of this.config.sections) {
      this.initializeSection(sectionConfig.id, sectionConfig.styleId)
    }
  }

  /**
   * Initialize a section using the registry
   */
  private initializeSection(sectionId: string, styleId: string): void {
    const SectionClass = SECTION_REGISTRY[sectionId]

    if (!SectionClass) {
      console.warn(`Unknown section ID: ${sectionId}`)
      return
    }

    const section = new SectionClass(styleId)
    this.sections.set(sectionId, section)
  }

  /**
   * Build complete Typst document with provided data
   */
  build(data: TemplateData): string {
    // 1. Global helpers (document setup + helper functions)
    const globalStyle = this.globalHelpers.getStyle()

    // 2. All section style functions
    const sectionStyles = Array.from(this.sections.values())
      .map((section) => section.getStyle())
      .filter((style) => style.trim().length > 0)
      .join('\n\n')

    // 3. Content sections in order from config
    const content = this.generateContent(data)

    // Assemble final document
    const typstString = `${globalStyle}\n${sectionStyles}\n${content}`
    // console.log(typstString)
    return typstString
  }

  /**
   * Generate content for all sections in config order
   */
  private generateContent(data: TemplateData): string {
    const contentParts: Array<string> = []

    for (const sectionConfig of this.config.sections) {
      const section = this.sections.get(sectionConfig.id)
      if (!section) continue

      // Get data for this section
      const rawData = data[sectionConfig.id]
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      if (rawData === undefined) continue

      // Normalize to array (sections always expect arrays)
      const sectionData = Array.isArray(rawData) ? rawData : [rawData]

      // Generate content (section handles header and empty check)
      const content = section.generateContent(sectionData)
      if (content.trim().length > 0) {
        contentParts.push(content)
      }
    }

    return contentParts.join('\n\n')
  }

  /**
   * Get all section schemas (for form defaults with .default() values)
   */
  getSchemas(): Record<string, ReturnType<Section['getSchema']>> {
    const schemas: Record<string, ReturnType<Section['getSchema']>> = {}

    for (const [sectionId, section] of this.sections.entries()) {
      schemas[sectionId] = section.getSchema()
    }

    return schemas
  }

  /**
   * Get all data schemas (for AI parsing/tailoring - all fields required, no defaults)
   */
  getDataSchemas(): Record<string, z.ZodType<any, any, any>> {
    const schemas: Record<string, z.ZodType<any, any, any>> = {}

    for (const [sectionId, section] of this.sections.entries()) {
      schemas[sectionId] = section.getDataSchema()
    }

    return schemas
  }

  /**
   * Get all UI schemas (for dynamic form generation)
   */
  getUISchemas(): Array<ReturnType<Section['getUISchema']>> {
    return Array.from(this.sections.values()).map((section) =>
      section.getUISchema(),
    )
  }

  /**
   * Get the template configuration
   */
  getConfig(): TemplateConfig {
    return this.config
  }

  /**
   * Get default data for all sections in current config
   * Uses Zod schema defaults to generate empty/initialized data
   * Returns one entry per section (even for multiple sections) for form initialization
   */
  getDefaults(): TemplateData {
    const defaults: TemplateData = {}

    for (const sectionConfig of this.config.sections) {
      const section = this.sections.get(sectionConfig.id)
      if (!section) continue

      const schema = section.getSchema()
      const uiSchema = section.getUISchema()

      // Use Zod to generate defaults from schema
      const defaultEntry = schema.parse({})

      if (uiSchema.multiple) {
        // Multiple section: array with one default entry
        defaults[sectionConfig.id] = [defaultEntry]
      } else {
        // Single section: the object itself (not wrapped in array)
        defaults[sectionConfig.id] = defaultEntry
      }
    }

    return defaults
  }
}

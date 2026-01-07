/**
 * Template ID Management
 * Handles parsing, serialization, and validation of template configurations
 */

import { z } from 'zod'
import { DocumentSetupSchema } from '@templates/shared/document-config'
import type { SectionId } from '@templates/template.types'

export const SectionConfigSchema = z.object({
  id: z.string(),
  styleId: z.string(),
})

export const TemplateConfigSchema = z.object({
  globalConfig: DocumentSetupSchema,
  sections: z.array(SectionConfigSchema),
})

export type TemplateConfig = z.infer<typeof TemplateConfigSchema>
export type SectionConfig = z.infer<typeof SectionConfigSchema>

export class TemplateId {
  /**
   * Parse and validate from JSON or Base64 string
   * Automatically validates structure using Zod schemas
   *
   * @param id - JSON string or Base64-encoded JSON string
   * @returns Validated TemplateConfig object
   * @throws Error if invalid format or validation fails
   */
  static parse(id: string): TemplateConfig {
    try {
      const parsed = JSON.parse(id)
      return TemplateConfigSchema.parse(parsed)
    } catch (e) {
      try {
        const decoded = atob(id)
        const parsed = JSON.parse(decoded)
        return TemplateConfigSchema.parse(parsed)
      } catch {
        throw new Error(
          'Invalid template ID: must be valid JSON or Base64-encoded JSON',
        )
      }
    }
  }

  /**
   * Serialize to JSON string with validation
   * Used for development and manipulation
   *
   * @param config - TemplateConfig object
   * @returns Pretty-printed JSON string
   */
  static toJSON(config: TemplateConfig): string {
    const validated = TemplateConfigSchema.parse(config)
    return JSON.stringify(validated, null, 2)
  }

  /**
   * Serialize to Base64 with validation
   * Used for DB storage and URL sharing
   *
   * @param config - TemplateConfig object
   * @returns Base64-encoded string
   */
  static toBase64(config: TemplateConfig): string {
    const validated = TemplateConfigSchema.parse(config)
    return btoa(JSON.stringify(validated))
  }

  /**
   * Get specific section config from template
   *
   * @param config - TemplateConfig object
   * @param sectionId - Section identifier
   * @returns SectionConfig if found, null otherwise
   */
  static getSectionConfig(
    config: TemplateConfig,
    sectionId: SectionId,
  ): SectionConfig | null {
    return config.sections.find((s) => s.id === sectionId) || null
  }
}

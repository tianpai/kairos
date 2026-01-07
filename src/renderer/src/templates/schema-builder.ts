/**
 * Resume Schema Builder
 * Builds Zod schemas for AI tasks based on template configuration
 */

import { z } from 'zod'
import { TemplateBuilder } from './builder'

/**
 * Build a Zod schema for resume parsing (includes all template sections)
 * Used when we don't have existing resume data yet
 */
export function buildResumeZodSchema(templateId: string): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const builder = new TemplateBuilder(templateId)
  const sectionSchemas = builder.getDataSchemas()
  const uiSchemas = builder.getUISchemas()

  const schemaShape: Record<string, z.ZodTypeAny> = {}
  for (const [sectionId, sectionSchema] of Object.entries(sectionSchemas)) {
    const uiSchema = uiSchemas.find((s) => s.id === sectionId)
    schemaShape[sectionId] = uiSchema?.multiple
      ? z.array(sectionSchema)
      : sectionSchema
  }

  return z.object(schemaShape)
}

/**
 * Build a Zod schema for resume tailoring (only includes sections present in resume)
 * Prevents AI from adding empty sections that don't exist in the original
 */
export function buildTailoringZodSchema(
  templateId: string,
  resumeStructure: Record<string, unknown>,
): z.ZodObject<Record<string, z.ZodTypeAny>> {
  const builder = new TemplateBuilder(templateId)
  const sectionSchemas = builder.getDataSchemas()
  const uiSchemas = builder.getUISchemas()

  const schemaShape: Record<string, z.ZodTypeAny> = {}
  for (const [sectionId, sectionSchema] of Object.entries(sectionSchemas)) {
    // Only include sections that exist in current resume
    const sectionData = resumeStructure[sectionId]
    if (sectionData === undefined) continue

    // Skip empty arrays (section exists but has no content)
    if (Array.isArray(sectionData) && sectionData.length === 0) continue

    const uiSchema = uiSchemas.find((s) => s.id === sectionId)
    schemaShape[sectionId] = uiSchema?.multiple
      ? z.array(sectionSchema)
      : sectionSchema
  }

  return z.object(schemaShape)
}

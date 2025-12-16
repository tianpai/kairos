/**
 * Pre-made Template Definitions
 * Registry of ready-to-use template configurations
 */

import type { TemplateConfig } from '@templates/templateId'
import { DocumentSetupSchema } from '@templates/shared/document-config'
import { SECTION_IDS } from '@templates/template.types'

/**
 * Default template with all available sections
 * Used as the starting point for new job applications
 * AI parsing uses this to generate schema for all sections
 */
export const DEFAULT_TEMPLATE: TemplateConfig = {
  globalConfig: DocumentSetupSchema.parse({}), // Uses Zod defaults
  sections: [
    { id: SECTION_IDS.PERSONAL_INFO, styleId: 'default' },
    { id: SECTION_IDS.SUMMARY, styleId: 'default' },
    { id: SECTION_IDS.WORK_EXPERIENCE, styleId: 'default' },
    { id: SECTION_IDS.EDUCATION, styleId: 'default' },
    { id: SECTION_IDS.PROJECTS, styleId: 'default' },
    { id: SECTION_IDS.SKILLS, styleId: 'default' },
    { id: SECTION_IDS.CERTIFICATES, styleId: 'default' },
    { id: SECTION_IDS.EXTRACURRICULARS, styleId: 'default' },
  ],
}
Object.freeze(DEFAULT_TEMPLATE)

/**
 * Registry of pre-made templates
 * Key = simple template name (short, used in UI)
 * Value = TemplateConfig object
 */
export const premadeTemplates: Readonly<Record<string, TemplateConfig>> = {
  default: DEFAULT_TEMPLATE,
  // Future templates can be added here:
  // 'tech-focused': { ... },
  // 'academic': { ... },
}
Object.freeze(premadeTemplates)

/**
 * Default template name for new job applications
 */
export const DEFAULT_TEMPLATE_NAME = 'default'

import { z } from 'zod'
import { SECTION_IDS } from '@templates/template.types'
import { escapeTypstMarkup } from '@templates/shared/codegen-helper'
import type { Section, SectionUISchema } from '@templates/template.types'

// Data schema for AI parsing/tailoring - all required (no defaults)
export const SummaryDataSchema = z.object({
  content: z.string(),
})

// Full schema for UI/storage - with defaults
export const SummarySchema = z.object({
  content: z.string().default(''),
})

export type Summary = z.infer<typeof SummarySchema>

export class SummarySection implements Section<Summary> {
  getStyle(): string {
    return ''
  }

  getSchema(): z.ZodType<Summary, any, any> {
    return SummarySchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return SummaryDataSchema
  }

  getUISchema(): SectionUISchema {
    return UI_SCHEMA
  }

  generateContent(data: Array<Summary>): string {
    if (data.length === 0 || !data[0].content) return ''

    const content = escapeTypstMarkup(data[0].content)
    return `== Summary\n${content}`
  }
}

const UI_SCHEMA: SectionUISchema = {
  id: SECTION_IDS.SUMMARY,
  label: 'Summary',
  multiple: false,
  required: false,
  fields: [
    {
      key: 'content',
      label: '',
      type: 'textarea',
    },
  ],
}

/**
 * Work Experience Section
 * Self-contained: schema, UI schema, styles, and content generation
 */

import { z } from 'zod'
import type { Section, SectionUISchema } from '@templates/template.types'
import {
  escapeTypstString,
  formatBulletList,
} from '@templates/shared/codegen-helper'
import { SECTION_IDS } from '@templates/template.types'

// Data schema for AI parsing/tailoring - all required (no defaults)
export const WorkExperienceDataSchema = z.object({
  title: z.string(),
  location: z.string(),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullet_points: z.array(z.string()),
})

// Full schema for UI/storage - with defaults
export const WorkExperienceSchema = z.object({
  title: z.string().default(''),
  location: z.string().default(''),
  company: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  bullet_points: z.array(z.string()).default([]),
})

export type WorkExperience = z.infer<typeof WorkExperienceSchema>

export class WorkExperienceSection implements Section<WorkExperience> {
  private styleId: string

  constructor(styleId: string = 'default') {
    this.styleId = styleId
  }

  getStyle(): string {
    return STYLES[this.styleId] || STYLES.default
  }

  getSchema(): z.ZodType<WorkExperience, any, any> {
    return WorkExperienceSchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return WorkExperienceDataSchema
  }

  getUISchema(): SectionUISchema {
    return UI_SCHEMA
  }

  generateContent(data: Array<WorkExperience>): string {
    if (data.length === 0) return ''

    const content = data
      .map((exp) => {
        const bullets = formatBulletList(exp.bullet_points)
        return `
#work(
  title: "${escapeTypstString(exp.title)}",
  location: "${escapeTypstString(exp.location)}",
  company: "${escapeTypstString(exp.company)}",
  dates: dates-helper(start-date: "${escapeTypstString(exp.startDate)}", end-date: "${escapeTypstString(exp.endDate)}"),
)
${bullets}`
      })
      .join('\n')

    return `== Work Experience\n${content}`
  }
}

const UI_SCHEMA: SectionUISchema = {
  id: SECTION_IDS.WORK_EXPERIENCE,
  label: 'Work Experience',
  multiple: true,
  required: false,
  fields: [
    { key: 'title', label: 'Job Title', type: 'text' },
    { key: 'company', label: 'Company', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    {
      key: 'bullet_points',
      label: 'Responsibilities',
      type: 'text-array',
    },
  ],
}

const STYLES: Record<string, string> = {
  default: `#let work(
  title: "",
  dates: "",
  company: "",
  location: "",
) = {
  generic-two-by-two(
    top-left: strong(title),
    top-right: dates,
    bottom-left: company,
    bottom-right: emph(location),
  )
}`,
}

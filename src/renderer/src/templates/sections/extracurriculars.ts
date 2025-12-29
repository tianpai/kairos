/**
 * Extracurriculars Section
 * Self-contained: schema, UI schema, styles, and content generation
 */

import { z } from 'zod'
import { SECTION_IDS } from '@templates/template.types'
import {
  escapeTypstString,
  formatBulletList,
} from '@templates/shared/codegen-helper'
import type { Section, SectionUISchema } from '@templates/template.types'

// Data schema for AI parsing/tailoring - all required (no defaults)
export const ExtracurricularDataSchema = z.object({
  activity: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullet_points: z.array(z.string()),
})

// Full schema for UI/storage - with defaults
export const ExtracurricularSchema = z.object({
  activity: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  bullet_points: z.array(z.string()).default([]),
})

export type Extracurricular = z.infer<typeof ExtracurricularSchema>

export class ExtracurricularsSection implements Section<Extracurricular> {
  private styleId: string

  constructor(styleId: string = 'default') {
    this.styleId = styleId
  }

  getStyle(): string {
    return STYLES[this.styleId] || STYLES.default
  }

  getSchema(): z.ZodType<Extracurricular, any, any> {
    return ExtracurricularSchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return ExtracurricularDataSchema
  }

  getUISchema(): SectionUISchema {
    return UI_SCHEMA
  }

  generateContent(data: Array<Extracurricular>): string {
    if (data.length === 0) return ''

    const content = data
      .map((activity) => {
        const bullets = formatBulletList(activity.bullet_points)
        return `
#extracurriculars(
  activity: "${escapeTypstString(activity.activity)}",
  dates: dates-helper(start-date: "${escapeTypstString(activity.startDate)}", end-date: "${escapeTypstString(activity.endDate)}"),
)
${bullets}`
      })
      .join('\n')

    return `== Extracurricular Activities\n${content}`
  }
}

const UI_SCHEMA: SectionUISchema = {
  id: SECTION_IDS.EXTRACURRICULARS,
  label: 'Extracurricular Activities',
  multiple: true,
  required: false,
  fields: [
    { key: 'activity', label: 'Activity', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    {
      key: 'bullet_points',
      label: 'Description',
      type: 'text-array',
    },
  ],
}

const STYLES: Record<string, string> = {
  default: `
#let extracurriculars(
  activity: "",
  dates: "",
) = {
  generic-one-by-two(
    left: strong(activity),
    right: dates,
  )
}`,
}

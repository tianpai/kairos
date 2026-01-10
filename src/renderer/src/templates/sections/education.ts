/**
 * Education Section
 * Self-contained: schema, UI schema, styles, and content generation
 */

import { GraduationCap } from 'lucide-react'
import { z } from 'zod'
import { SECTION_IDS } from '@templates/template.types'
import {
  escapeTypstString,
  formatBulletList,
} from '@templates/shared/codegen-helper'
import type { Section, SectionUISchema } from '@templates/template.types'

// Data schema for AI parsing/tailoring - all required (no defaults)
export const EducationDataSchema = z.object({
  institution: z.string(),
  location: z.string(),
  degree: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  bullet_points: z.array(z.string()),
})

// Full schema for UI/storage - with defaults
export const EducationSchema = z.object({
  institution: z.string().default(''),
  location: z.string().default(''),
  degree: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  bullet_points: z.array(z.string()).default([]),
})

export type Education = z.infer<typeof EducationSchema>

export class EducationSection implements Section<Education> {
  private styleId: string

  constructor(styleId: string = 'default') {
    this.styleId = styleId
  }

  getStyle(): string {
    return STYLES[this.styleId] || STYLES.default
  }

  getSchema(): z.ZodType<Education, any, any> {
    return EducationSchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return EducationDataSchema
  }

  getUISchema(): SectionUISchema {
    return UI_SCHEMA
  }

  generateContent(data: Array<Education>): string {
    if (data.length === 0) return ''

    const content = data
      .map((edu) => {
        const bullets = formatBulletList(edu.bullet_points)
        return `
#edu(
  institution: "${escapeTypstString(edu.institution)}",
  location: "${escapeTypstString(edu.location)}",
  dates: dates-helper(start-date: "${escapeTypstString(edu.startDate)}", end-date: "${escapeTypstString(edu.endDate)}"),
  degree: "${escapeTypstString(edu.degree)}",
)
${bullets}`
      })
      .join('\n')

    return `== Education\n${content}`
  }
}

const UI_SCHEMA: SectionUISchema = {
  id: SECTION_IDS.EDUCATION,
  label: 'Education',
  icon: GraduationCap,
  multiple: true,
  required: false,
  fields: [
    { key: 'institution', label: 'Institution', type: 'text' },
    { key: 'location', label: 'Location', type: 'text' },
    { key: 'degree', label: 'Degree', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    {
      key: 'bullet_points',
      label: 'Achievements/Coursework',
      type: 'text-array',
    },
  ],
}

const STYLES: Record<string, string> = {
  default: `
#let edu(
  institution: "",
  dates: "",
  degree: "",
  location: "",
) = {
    generic-two-by-two(
      top-left: strong(institution),
      top-right: dates,
      bottom-left: emph(degree),
      bottom-right: emph(location),
    )
}`,
}

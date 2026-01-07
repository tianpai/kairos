/**
 * Projects Section
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
export const ProjectDataSchema = z.object({
  name: z.string(),
  role: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  url: z.string(),
  bullet_points: z.array(z.string()),
})

// Full schema for UI/storage - with defaults
export const ProjectSchema = z.object({
  name: z.string().default(''),
  role: z.string().default(''),
  startDate: z.string().default(''),
  endDate: z.string().default(''),
  url: z.string().default(''),
  bullet_points: z.array(z.string()).default([]),
})

export type Project = z.infer<typeof ProjectSchema>

export class ProjectsSection implements Section<Project> {
  private styleId: string

  constructor(styleId: string = 'default') {
    this.styleId = styleId
  }

  getStyle(): string {
    return STYLES[this.styleId] || STYLES.default
  }

  getSchema(): z.ZodType<Project, any, any> {
    return ProjectSchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return ProjectDataSchema
  }

  getUISchema(): SectionUISchema {
    return UI_SCHEMA
  }

  generateContent(data: Array<Project>): string {
    if (data.length === 0) return ''

    const content = data
      .map((project) => {
        const bullets = formatBulletList(project.bullet_points)
        return `
#project(
  role: "${escapeTypstString(project.role)}",
  name: "${escapeTypstString(project.name)}",
  url: "${escapeTypstString(project.url)}",
  dates: dates-helper(start-date: "${escapeTypstString(project.startDate)}", end-date: "${escapeTypstString(project.endDate)}"),
)
${bullets}`
      })
      .join('\n')

    return `== Projects\n${content}`
  }
}

const UI_SCHEMA: SectionUISchema = {
  id: SECTION_IDS.PROJECTS,
  label: 'Projects',
  multiple: true,
  required: false,
  fields: [
    { key: 'name', label: 'Project Name', type: 'text' },
    { key: 'role', label: 'Role', type: 'text' },
    { key: 'startDate', label: 'Start Date', type: 'date' },
    { key: 'endDate', label: 'End Date', type: 'date' },
    { key: 'url', label: 'URL', type: 'url' },
    {
      key: 'bullet_points',
      label: 'Description',
      type: 'text-array',
    },
  ],
}

const STYLES: Record<string, string> = {
  default: `
#let project(
  role: "",
  name: "",
  url: "",
  dates: "",
) = {
  generic-one-by-two(
    left: {
      if role == "" {
        [*#name* #if url != "" and dates != "" [ (#link("https://" + url)[#url])]]
      } else {
        [*#role*, #name #if url != "" and dates != ""  [ (#link("https://" + url)[#url])]]
      }
    },
    right: {
      if dates == "" and url != "" {
        link("https://" + url)[#url]
      } else {
        dates
      }
    },
  )
}`,
}

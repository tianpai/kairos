/**
 * Skills Section
 * Self-contained: schema, UI schema, styles, and content generation
 */

import { BicepsFlexed } from 'lucide-react'
import { z } from 'zod'
import { SECTION_IDS } from '@templates/template.types'
import {
  escapeTypstMarkup,
  formatSkillItems,
} from '@templates/shared/codegen-helper'
import type { Section, SectionUISchema } from '@templates/template.types'

// Data schema for AI parsing/tailoring - all required (no defaults)
export const SkillDataSchema = z.object({
  category: z.string(),
  items: z.array(z.string()),
})

// Full schema for UI/storage - with defaults
export const SkillSchema = z.object({
  category: z.string().default(''),
  items: z.array(z.string()).default([]),
})

export type Skill = z.infer<typeof SkillSchema>

export class SkillsSection implements Section<Skill> {
  private styleId: string

  constructor(styleId: string = 'default') {
    this.styleId = styleId
  }

  getStyle(): string {
    return STYLES[this.styleId] || STYLES.default
  }

  getSchema(): z.ZodType<Skill, any, any> {
    return SkillSchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return SkillDataSchema
  }

  getUISchema(): SectionUISchema {
    return UI_SCHEMA
  }

  generateContent(data: Array<Skill>): string {
    if (data.length === 0) return ''

    const content = data
      .map(
        (skill) =>
          `- *${escapeTypstMarkup(skill.category)}*: ${formatSkillItems(skill.items)}`,
      )
      .join('\n')

    return `== Skills\n${content}`
  }
}

const UI_SCHEMA: SectionUISchema = {
  id: SECTION_IDS.SKILLS,
  label: 'Skills',
  icon: BicepsFlexed,
  multiple: true,
  required: false,
  fields: [
    { key: 'category', label: 'Category', type: 'text' },
    {
      key: 'items',
      label: 'Skills',
      type: 'text-array',
    },
  ],
}

const STYLES: Record<string, string> = {
  default: '',
}

/**
 * Personal Information Section
 * Special section that wraps the entire document with #show:
 */

import { User } from 'lucide-react'
import { z } from 'zod'
import { SECTION_IDS } from '@templates/template.types'
import type { Section, SectionUISchema } from '@templates/template.types'

// ============================================================================
// ZOD SCHEMA
// ============================================================================

// Data schema for AI parsing/tailoring - only content fields, all required (no defaults)
export const PersonalInfoDataSchema = z.object({
  author: z.string(),
  location: z.string(),
  email: z.string(),
  github: z.string(),
  linkedin: z.string(),
  phone: z.string(),
  personalSite: z.string(),
  pronouns: z.string(),
})

// Full schema for UI/storage - content fields with defaults + UI formatting options
export const PersonalInfoSchema = z.object({
  author: z.string().default(''),
  location: z.string().default(''),
  email: z.string().default(''),
  github: z.string().default(''),
  linkedin: z.string().default(''),
  phone: z.string().default(''),
  personalSite: z.string().default(''),
  pronouns: z.string().default(''),
  authorPosition: z.enum(['left', 'center', 'right']).default('left'),
  personalInfoPosition: z.enum(['left', 'center', 'right']).default('left'),
  authorFontSize: z
    .enum(['17pt', '18pt', '19pt', '20pt', '21pt', '22pt'])
    .default('20pt'),
})

export type PersonalInfo = z.infer<typeof PersonalInfoSchema>

export class PersonalInfoSection implements Section<PersonalInfo> {
  constructor(_styleId: string = 'default') {}

  getStyle(): string {
    return PERSONAL_INFO_STYLE
  }

  getSchema(): z.ZodType<PersonalInfo, any, any> {
    return PersonalInfoSchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return PersonalInfoDataSchema
  }

  getUISchema(): SectionUISchema {
    return {
      id: SECTION_IDS.PERSONAL_INFO,
      label: 'Personal Information',
      icon: User,
      multiple: false,
      required: true,
      fields: [
        { key: 'author', label: 'Full Name', type: 'text' },
        { key: 'email', label: 'Email', type: 'email' },
        { key: 'phone', label: 'Phone', type: 'tel' },
        { key: 'location', label: 'Location', type: 'text' },
        { key: 'github', label: 'GitHub', type: 'text' },
        { key: 'linkedin', label: 'LinkedIn', type: 'text' },
        { key: 'personalSite', label: 'Personal Website', type: 'text' },
        { key: 'pronouns', label: 'Pronouns', type: 'text' },
        {
          key: 'authorPosition',
          label: 'Name Alignment',
          type: 'select',
          options: ['left', 'center', 'right'],
        },
        {
          key: 'personalInfoPosition',
          label: 'Contact Alignment',
          type: 'select',
          options: ['left', 'center', 'right'],
        },
        {
          key: 'authorFontSize',
          label: 'Name Font Size',
          type: 'select',
          options: ['17pt', '18pt', '19pt', '20pt', '21pt', '22pt'],
        },
      ],
    }
  }

  generateContent(data: Array<PersonalInfo>): string {
    if (data.length === 0) return ''
    const info = data[0]

    return `
#show: personalInfo.with(
  author: "${info.author}",
  location: "${info.location}",
  email: "${info.email}",
  github: "${info.github}",
  linkedin: "${info.linkedin}",
  phone: "${info.phone}",
  personal-site: "${info.personalSite}",
  pronouns: "${info.pronouns}",
  author-position: ${info.authorPosition},
  personal-info-position: ${info.personalInfoPosition},
  author-font-size: ${info.authorFontSize},
)
`
  }
}

const PERSONAL_INFO_STYLE = `
#let personalInfo(
  author: "",
  author-position: left,
  personal-info-position: left,
  pronouns: "",
  location: "",
  email: "",
  github: "",
  linkedin: "",
  phone: "",
  personal-site: "",
  author-font-size: 20pt,
  body,
) = {
  show heading.where(level: 1): it => [
    #set align(author-position)
    #set text(
      weight: 700,
      size: author-font-size,
    )
    #pad(it.body)
  ]
  [= #(author)]
  let contact-item(value, prefix: "", link-type: "") = {
    if value != "" {
      if link-type != "" {
        link(link-type + value)[#(prefix + value)]
      } else {
        value
      }
    }
  }
  pad(
    top: 0.25em,
    align(personal-info-position)[
      #{
        let items = (
          contact-item(pronouns),
          contact-item(phone),
          contact-item(location),
          contact-item(email, link-type: "mailto:"),
          contact-item(github, link-type: "https://"),
          contact-item(linkedin, link-type: "https://"),
          contact-item(personal-site, link-type: "https://"),
        )
        items.filter(x => x != none).join(" | ")
      }
    ],
  )
  set par(justify: true)
  body
}`

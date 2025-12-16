/**
 * Certificates Section
 * Self-contained: schema, UI schema, styles, and content generation
 */

import { z } from 'zod'
import { escapeTypstString } from '@templates/shared/codegen-helper'
import { SECTION_IDS } from '@templates/template.types'
import type { Section, SectionUISchema } from '@templates/template.types'

// Data schema for AI parsing/tailoring - all required (no defaults)
export const CertificateDataSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  url: z.string(),
  date: z.string(),
})

// Full schema for UI/storage - with defaults
export const CertificateSchema = z.object({
  name: z.string().default(''),
  issuer: z.string().default(''),
  url: z.string().default(''),
  date: z.string().default(''),
})

export type Certificate = z.infer<typeof CertificateSchema>

export class CertificatesSection implements Section<Certificate> {
  private styleId: string

  constructor(styleId: string = 'default') {
    this.styleId = styleId
  }

  getStyle(): string {
    return STYLES[this.styleId] || STYLES.default
  }

  getSchema(): z.ZodType<Certificate, any, any> {
    return CertificateSchema
  }

  getDataSchema(): z.ZodType<any, any, any> {
    return CertificateDataSchema
  }

  getUISchema(): SectionUISchema {
    return UI_SCHEMA
  }

  generateContent(data: Array<Certificate>): string {
    if (data.length === 0) return ''

    const content = data
      .map(
        (cert) => `#certificates(
  name: "${escapeTypstString(cert.name)}",
  issuer: "${escapeTypstString(cert.issuer)}",
  url: "${escapeTypstString(cert.url)}",
  date: "${escapeTypstString(cert.date)}",
)
`,
      )
      .join('\n')

    return `== Certificates\n${content}`
  }
}

const UI_SCHEMA: SectionUISchema = {
  id: SECTION_IDS.CERTIFICATES,
  label: 'Certificates',
  multiple: true,
  required: false,
  fields: [
    { key: 'name', label: 'Certificate Name', type: 'text' },
    { key: 'issuer', label: 'Issuer', type: 'text' },
    { key: 'url', label: 'URL', type: 'url' },
    { key: 'date', label: 'Date', type: 'date' },
  ],
}

const STYLES: Record<string, string> = {
  default: `#let certificates(
  name: "",
  issuer: "",
  url: "",
  date: "",
) = {
  [
    *#name*#if issuer != "" {[, #issuer]}
    #if url != "" {
      [ (#link("https://" + url)[#url])]
    }
    #h(1fr) #date
  ]
}`,
}

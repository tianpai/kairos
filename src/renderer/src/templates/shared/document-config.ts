/**
 * Global Helper Functions Section
 * Special section that provides Typst helper functions and document configuration
 * Has UI schema for user configuration
 */

import { z } from 'zod'

// ============================================================================
// DOCUMENT SETUP SCHEMA
// ============================================================================

export const DocumentSetupSchema = z.object({
  font: z
    .enum(['New Computer Modern', 'Lato', 'Charter', 'Inter', 'Noto Sans'])
    .default('New Computer Modern'),
  fontSize: z.enum(['9pt', '10pt', '11pt']).default('10pt'),
  headingColor: z.string().default('#000000'),
  margin: z
    .enum(['0.5in', '0.6in', '0.7in', '0.8in', '0.9in', '1in'])
    .default('0.5in'),
  paperSize: z.enum(['us-letter', 'a4']).default('us-letter'),
})

export type DocumentSetup = z.infer<typeof DocumentSetupSchema>

// ============================================================================
// GLOBAL HELPER FUNCTIONS (from resume.typ)
// ============================================================================

const generateDocumentSetup = (config: DocumentSetup) => `
#show heading: set text(
    fill: rgb("${config.headingColor}"),
)
#set text(
    font: "${config.font}",
    size: ${config.fontSize},
    lang: "en",
    // Disable ligatures so ATS systems do not get confused when parsing fonts.
    ligatures: false
  )
#set page(
    margin: (${config.margin}),
    paper: "${config.paperSize}",
  )
#show heading.where(level: 2): it => [
    #pad(top: 0pt, bottom: -10pt, [#smallcaps(it.body)])
    #line(length: 100%, stroke: 1pt)
  ]
`

const GLOBAL_HELPERS = `
#let generic-two-by-two(
  top-left: "",
  top-right: "",
  bottom-left: "",
  bottom-right: "",
) = {
  [
    #top-left #h(1fr) #top-right 

    #bottom-left #h(1fr) #bottom-right
  ]
}

#let generic-one-by-two(
  left: "",
  right: "",
) = {
  [
    #left #h(1fr) #right
  ]
}

#let dates-helper(
  start-date: "",
  end-date: "",
) = {
  if start-date != "" and end-date != "" {
    start-date + " " + $-$ + " " + end-date
  } else if start-date != "" {
    start-date
  } else if end-date != "" {
    end-date
  } else {
    ""
  }
}`

/**
 * Global helper functions and document configuration
 * Note: Does NOT implement Section interface - this is not a content section.
 * It provides document-wide styling and helper functions, stored separately from content sections.
 */
export class GlobalHelpersSection {
  private config: DocumentSetup

  constructor(config?: Partial<DocumentSetup>) {
    // Use defaults from schema if config not provided
    this.config = DocumentSetupSchema.parse(config || {})
  }

  /**
   * Returns global Typst helper functions with configured document setup
   * Called by: TemplateBuilder.build() - line 68
   */
  getStyle(): string {
    return generateDocumentSetup(this.config) + GLOBAL_HELPERS
  }
}

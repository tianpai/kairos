/**
 * Shared types for template system
 */

import type { LucideIcon } from 'lucide-react'
import type { z } from 'zod'

/**
 * Section ID Constants
 * Central definition of all available section identifiers
 */

export const SECTION_IDS = {
  PERSONAL_INFO: 'personalInfo',
  EDUCATION: 'education',
  WORK_EXPERIENCE: 'workExperience',
  PROJECTS: 'projects',
  SKILLS: 'skills',
  CERTIFICATES: 'certificates',
  EXTRACURRICULARS: 'extracurriculars',
  SUMMARY: 'summary',
} as const

// Type for section IDs
export type SectionId = (typeof SECTION_IDS)[keyof typeof SECTION_IDS]

/**
 * Field types for UI rendering
 */
export type FieldType =
  | 'text' // Single line text input
  | 'email' // Email input with validation
  | 'url' // URL input
  | 'tel' // Phone number
  | 'date' // Date picker
  | 'color' // Color picker
  | 'textarea' // Multi-line text
  | 'select' // Dropdown
  | 'text-array' // Array of text inputs with add/remove buttons

/**
 * The actual runtime value a field can hold.
 * - Most field types hold a string
 * - text-array holds an array of strings
 */
export type FieldValue = string | Array<string>

/**
 * A single entry in a section (object with field keys mapping to values).
 */
export type SectionEntry = Record<string, FieldValue>

/**
 * The value of a section in template data.
 * - Single sections: one SectionEntry
 * - Multiple sections: array of SectionEntry
 */
export type SectionValue = SectionEntry | Array<SectionEntry>

/**
 * Complete template data structure.
 * Maps section IDs to their values.
 */
export type TemplateData = Record<string, SectionValue>

// ============================================================================
// UI SCHEMA TYPES
// ============================================================================

/**
 * Schema for a single field in a section
 */
export interface FieldSchema {
  /** Field name in data object */
  key: string
  /** Display label */
  label: string
  /** Input type */
  type: FieldType
  /** Optional placeholder text */
  placeholder?: string
  /** Options for select type only */
  options?: Array<string>
}

/**
 * Schema for a section (e.g., personalInfo, workExperience)
 *
 * Cardinality (multiple, required):
 * - (false, false) = zero or one
 * - (false, true)  = one
 * - (true, false)  = zero or more
 * - (true, true)   = one or more
 */
export interface SectionUISchema {
  /** Section identifier (e.g., "personalInfo", "workExperience") */
  id: string
  /** Display name (e.g., "Personal Information", "Work Experience") */
  label: string
  /** Icon component from lucide-react */
  icon: LucideIcon
  /** true = array, false = single object */
  multiple: boolean
  /** combined with multiple → 4 cardinality cases */
  required: boolean
  /** Fields in this section */
  fields: Array<FieldSchema>
}

// ============================================================================
// SECTION INTERFACE
// ============================================================================

/**
 * Interface that all section classes must implement
 *
 * Each section is a gateway that provides:
 * - Typst style function (getStyle)
 * - Zod schema for validation (getSchema)
 * - Data schema for AI parsing/tailoring (getDataSchema)
 * - UI schema for form generation (getUISchema)
 * - Content generation logic (generateContent)
 */
export interface Section<T = any> {
  /**
   * Get the Typst style function for this section
   * (e.g., "#let work(...) = { ... }")
   */
  getStyle: () => string

  /**
   * Get the Zod schema for this section's data (includes defaults for UI)
   */
  getSchema: () => z.ZodType<T, any, any>

  /**
   * Get the data-only Zod schema for AI parsing/tailoring (no defaults, all required)
   * Used to generate JSON schema for OpenAI structured output
   */
  getDataSchema: () => z.ZodType<any, any, any>

  /**
   * Get the UI schema for form generation
   */
  getUISchema: () => SectionUISchema

  /**
   * Generate Typst content by calling the style function
   * with the provided data
   */
  generateContent: (data: Array<T>) => string
}

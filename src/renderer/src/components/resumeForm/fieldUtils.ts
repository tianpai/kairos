import type { FieldValue } from '@templates/template.types'

export function asString(value: FieldValue): string {
  return typeof value === 'string' ? value : ''
}

export function asStringArray(value: FieldValue): Array<string> {
  return Array.isArray(value) ? value : []
}

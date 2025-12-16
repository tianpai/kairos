/**
 * Layer 1: Content utilities
 *
 * Pure data transformation functions with no styling decisions.
 * These are reusable across all templates.
 */

export function toSafeString(value: unknown): string {
  if (value === null || value === undefined) {
    return ''
  }
  return String(value)
}

export function escapeTypstString(value: unknown): string {
  const safeValue = toSafeString(value)
  return safeValue
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\$/g, '\\$')
    .replace(/\r?\n/g, '\\n')
}

export function escapeTypstMarkup(value: unknown): string {
  const safeValue = toSafeString(value)
  return safeValue
    .replace(/\\/g, '\\\\')
    .replace(/\*/g, '\\*')
    .replace(/_/g, '\\_')
    .replace(/#/g, '\\#')
    .replace(/\[/g, '\\[')
    .replace(/\]/g, '\\]')
    .replace(/~/g, '\\~')
    .replace(/\r?\n/g, ' ')
}

export function formatBulletList(
  items: Array<string | undefined | null>,
): string {
  const filtered = items
    .map((item) => escapeTypstMarkup(item))
    .filter((item) => item.length > 0)

  if (filtered.length === 0) {
    return ''
  }
  return filtered.map((item) => `- ${item}`).join('\n')
}

export function formatSkillItems(
  items: Array<string | undefined | null>,
): string {
  return items
    .map((item) => escapeTypstMarkup(item))
    .filter((item) => item.length > 0)
    .join(', ')
}

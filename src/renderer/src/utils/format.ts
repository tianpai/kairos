export function normalizeUrl(url: string): string | null {
  const trimmed = url.trim()
  if (!trimmed) return null
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

interface FormatDateOptions {
  locale?: string
  format?: Intl.DateTimeFormatOptions
}

const DEFAULT_LOCALE = 'en-US'
const DEFAULT_FORMAT: Intl.DateTimeFormatOptions = {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
}

export function formatDate(
  dateStr: string,
  options?: FormatDateOptions,
): string {
  const { locale = DEFAULT_LOCALE, format = DEFAULT_FORMAT } = options ?? {}
  const date = new Date(dateStr)
  return date.toLocaleDateString(locale, format)
}

/**
 * Convert raw error messages to user-friendly toast descriptions.
 * Pattern-matches common API/network errors.
 */
export function friendlyError(error: string): string {
  const lower = error.toLowerCase()

  if (
    lower.includes('api key') ||
    lower.includes('401') ||
    lower.includes('unauthorized')
  ) {
    return 'API key invalid or missing'
  }

  if (lower.includes('429') || lower.includes('rate limit')) {
    return 'Rate limit exceeded, try again later'
  }

  if (lower.includes('timeout') || lower.includes('timed out')) {
    return 'Request timed out'
  }

  if (
    lower.includes('fetch failed') ||
    lower.includes('network') ||
    lower.includes('econnrefused')
  ) {
    return 'Network error, check your connection'
  }

  if (lower.includes('500') || lower.includes('internal server')) {
    return 'AI provider server error'
  }

  // Fallback: truncate long messages
  return error.length > 80 ? error.slice(0, 80) + '...' : error
}

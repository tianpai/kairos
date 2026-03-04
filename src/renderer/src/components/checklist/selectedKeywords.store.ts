import { create } from 'zustand'

const EMPTY_SELECTED_KEYWORDS: string[] = []

interface SelectedKeywordsState {
  selectedByJobId: Record<string, string[]>
  getSelected: (jobId: string) => string[]
  toggleKeyword: (jobId: string, keyword: string) => void
  seedIfEmpty: (jobId: string, keywords: string[]) => void
  clear: (jobId: string) => void
}

function normalizeKeywords(keywords: string[]): string[] {
  const seen = new Set<string>()
  const normalized: string[] = []

  for (const rawKeyword of keywords) {
    const keyword = rawKeyword.trim()
    if (!keyword) continue

    const dedupeKey = keyword.toLowerCase()
    if (seen.has(dedupeKey)) continue

    seen.add(dedupeKey)
    normalized.push(keyword)
  }

  return normalized
}

export const useSelectedKeywordsStore = create<SelectedKeywordsState>()(
  (set, get) => ({
    selectedByJobId: {},

    getSelected: (jobId) =>
      get().selectedByJobId[jobId] ?? EMPTY_SELECTED_KEYWORDS,

    toggleKeyword: (jobId, keyword) => {
      const normalizedKeyword = keyword.trim()
      if (!normalizedKeyword) return

      set((state) => {
        const current = state.selectedByJobId[jobId] ?? []
        const hasKeyword = current.includes(normalizedKeyword)
        const next = hasKeyword
          ? current.filter((item) => item !== normalizedKeyword)
          : [...current, normalizedKeyword]

        return {
          selectedByJobId: {
            ...state.selectedByJobId,
            [jobId]: next,
          },
        }
      })
    },

    seedIfEmpty: (jobId, keywords) =>
      set((state) => {
        const current = state.selectedByJobId[jobId]
        if (current && current.length > 0) {
          return state
        }

        return {
          selectedByJobId: {
            ...state.selectedByJobId,
            [jobId]: normalizeKeywords(keywords),
          },
        }
      }),

    clear: (jobId) =>
      set((state) => {
        if (!(jobId in state.selectedByJobId)) {
          return state
        }

        const next = { ...state.selectedByJobId }
        delete next[jobId]
        return { selectedByJobId: next }
      }),
  }),
)

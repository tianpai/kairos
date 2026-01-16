import { useEffect, useState } from 'react'

export function useSelectedKeywords(initialKeywords?: Array<string>) {
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    new Set(),
  )

  useEffect(() => {
    if (initialKeywords) {
      setSelectedKeywords(new Set(initialKeywords))
    }
  }, [initialKeywords])

  const toggleKeyword = (keyword: string) => {
    setSelectedKeywords((prev) => {
      const next = new Set(prev)
      if (next.has(keyword)) {
        next.delete(keyword)
      } else {
        next.add(keyword)
      }
      return next
    })
  }

  return {
    selectedKeywords: Array.from(selectedKeywords),
    toggleKeyword,
  }
}

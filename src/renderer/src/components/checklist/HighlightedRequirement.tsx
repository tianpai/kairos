import type { ChecklistRequirement } from '@type/checklist'

interface HighlightedRequirementProps {
  text: string
  keywords: ChecklistRequirement['keywords']
  selectedKeywords: Array<string>
  onToggleKeyword: (keyword: string) => void
}

export function HighlightedRequirement({
  text,
  keywords,
  selectedKeywords,
  onToggleKeyword,
}: HighlightedRequirementProps) {
  if (keywords.length === 0) {
    return <span>{text}</span>
  }

  // Build regex pattern for all keywords (case-insensitive)
  const pattern = keywords
    .map((k) => k.keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('|')
  const regex = new RegExp(`(${pattern})`, 'gi')

  // Split text by keywords
  const parts = text.split(regex)

  return (
    <span>
      {parts.map((part, index) => {
        // Check if this part matches any keyword
        const matchedKeyword = keywords.find(
          (k) => k.keyword.toLowerCase() === part.toLowerCase(),
        )

        if (matchedKeyword) {
          const isFulfilled = matchedKeyword.isFulfilled
          const isSelected = selectedKeywords.includes(matchedKeyword.keyword)
          const isClickable = !isFulfilled

          let style: string
          if (isFulfilled) {
            style = 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300'
          } else if (isSelected) {
            style = 'bg-sky-200 text-sky-800 dark:bg-sky-800/60 dark:text-sky-200 cursor-pointer hover:bg-sky-300 dark:hover:bg-sky-700/60'
          } else {
            style = 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 cursor-pointer hover:bg-amber-200 dark:hover:bg-amber-800/40'
          }

          return (
            <mark
              key={index}
              className={`rounded px-0.5 transition-colors ${style}`}
              onClick={isClickable ? () => onToggleKeyword(matchedKeyword.keyword) : undefined}
            >
              {part}
            </mark>
          )
        }

        return <span key={index}>{part}</span>
      })}
    </span>
  )
}

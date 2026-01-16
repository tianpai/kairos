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
            style = 'bg-success-subtle text-success'
          } else if (isSelected) {
            style =
              'bg-selected-subtle text-selected cursor-pointer hover:bg-selected-subtle/80'
          } else {
            style =
              'bg-warning-subtle text-warning cursor-pointer hover:bg-warning-subtle/80'
          }

          return (
            <mark
              key={index}
              className={`rounded px-0.5 transition-colors ${style}`}
              onClick={
                isClickable
                  ? () => onToggleKeyword(matchedKeyword.keyword)
                  : undefined
              }
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

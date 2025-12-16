import { KeywordBadge } from './KeywordBadge'
import type { ChecklistRequirement } from '@type/checklist'

interface KeywordsListProps {
  keywords: ChecklistRequirement['keywords']
  selectedKeywords: Array<string>
  onToggleKeyword: (keyword: string) => void
}

export function KeywordsList({
  keywords,
  selectedKeywords,
  onToggleKeyword,
}: KeywordsListProps) {
  if (keywords.length === 0) {
    return null
  }

  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {keywords.map((keywordItem, index) => (
        <KeywordBadge
          key={index}
          keyword={keywordItem.keyword}
          isFulfilled={keywordItem.isFulfilled}
          isSelected={selectedKeywords.includes(keywordItem.keyword)}
          onClick={() => onToggleKeyword(keywordItem.keyword)}
        />
      ))}
    </div>
  )
}

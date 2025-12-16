import { RequirementItem } from './RequirementItem'
import type { ChecklistRequirement } from '@type/checklist'

interface ChecklistSectionProps {
  requirements: Array<ChecklistRequirement>
  selectedKeywords: Array<string>
  onToggleKeyword: (keyword: string) => void
}

export function ChecklistSection({
  requirements,
  selectedKeywords,
  onToggleKeyword,
}: ChecklistSectionProps) {
  if (requirements.length === 0) {
    return null
  }

  return (
    <div>
      <div>
        {requirements.map((requirement, index) => (
          <RequirementItem
            key={index}
            requirement={requirement}
            selectedKeywords={selectedKeywords}
            onToggleKeyword={onToggleKeyword}
          />
        ))}
      </div>
    </div>
  )
}

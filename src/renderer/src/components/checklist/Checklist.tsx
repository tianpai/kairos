import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Star, Users } from 'lucide-react'
import { getJobChecklist } from '@api/jobs'
import { ChecklistSection } from '@checklist/ChecklistSection'
import { IconTooltipButton } from '@ui/IconTooltipButton'
import { useSelectedKeywordsStore } from './selectedKeywords.store'
import type { Checklist } from '@type/checklist'
import type { LucideIcon } from 'lucide-react'

interface ChecklistProps {
  jobId: string | undefined
}

const tabs: { key: TabType; label: string; icon: LucideIcon }[] = [
  { key: 'hard', label: 'Must Have', icon: ShieldCheck },
  { key: 'soft', label: 'Soft Skills', icon: Users },
  { key: 'preferred', label: 'Preferred', icon: Star },
]

type TabType = 'hard' | 'soft' | 'preferred'

type ChecklistTabsProps = {
  checklist: Checklist
  activeTab: TabType
  onChange: (tab: TabType) => void
}

type ChecklistContentProps = {
  jobId: string
  checklist: Checklist
  activeTab: TabType
}

const EMPTY_KEYWORDS: string[] = []

function ChecklistTabs({ checklist, activeTab, onChange }: ChecklistTabsProps) {
  const requirementsByTab: Record<TabType, Checklist['hardRequirements']> = {
    hard: checklist.hardRequirements,
    soft: checklist.softRequirements,
    preferred: checklist.preferredSkills,
  }

  const visibleTabs = tabs.filter(
    (tab) => requirementsByTab[tab.key].length > 0,
  )

  return (
    <div className="bg-app-header flex flex-wrap justify-center gap-1 p-2">
      {visibleTabs.map((tab) => {
        return (
          <IconTooltipButton
            key={tab.key}
            icon={tab.icon}
            label={tab.label}
            active={activeTab === tab.key}
            onClick={() => onChange(tab.key)}
          />
        )
      })}
    </div>
  )
}

function ChecklistContent({
  jobId,
  checklist,
  activeTab,
}: ChecklistContentProps) {
  const selectedKeywords = useSelectedKeywordsStore(
    (state) => state.selectedByJobId[jobId] ?? EMPTY_KEYWORDS,
  )
  const toggleKeyword = useSelectedKeywordsStore((state) => state.toggleKeyword)
  const seedIfEmpty = useSelectedKeywordsStore((state) => state.seedIfEmpty)

  useEffect(() => {
    seedIfEmpty(jobId, checklist.needTailoring)
  }, [jobId, checklist.needTailoring, seedIfEmpty])

  const requirementsByTab: Record<TabType, Checklist['hardRequirements']> = {
    hard: checklist.hardRequirements,
    soft: checklist.softRequirements,
    preferred: checklist.preferredSkills,
  }

  const requirements = requirementsByTab[activeTab]

  return (
    <div className="flex-1 overflow-y-auto pr-2">
      <ChecklistSection
        requirements={requirements}
        selectedKeywords={selectedKeywords}
        onToggleKeyword={(keyword) => toggleKeyword(jobId, keyword)}
      />
    </div>
  )
}

function ChecklistLoadingState() {
  return (
    <div className="flex flex-1 py-2">
      <div className="flex h-full w-full items-center justify-center">
        <div className="w-full max-w-sm p-4">
          <div className="flex items-center gap-3">
            <span className="border-default h-4 w-4 animate-spin rounded-full border-2 border-t-transparent" />
            <div>
              <p className="text-primary text-sm font-medium">
                Checklist is still cooking
              </p>
              <p className="text-hint text-xs">Hang tight while we prep it.</p>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="bg-hover h-2 w-5/6 animate-pulse rounded-full" />
            <div className="bg-hover h-2 w-4/6 animate-pulse rounded-full" />
            <div className="bg-hover h-2 w-3/6 animate-pulse rounded-full" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Checklist({ jobId }: ChecklistProps) {
  const { data: checklist } = useQuery({
    queryKey: ['jobChecklist', jobId],
    queryFn: () => getJobChecklist(jobId!),
    enabled: !!jobId,
  })

  const [activeTab, setActiveTab] = useState<TabType>('hard')

  return (
    <div className="flex h-full flex-col">
      {checklist && jobId ? (
        <>
          <ChecklistTabs
            checklist={checklist}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <ChecklistContent
            jobId={jobId}
            checklist={checklist}
            activeTab={activeTab}
          />
        </>
      ) : (
        <ChecklistLoadingState />
      )}
    </div>
  )
}

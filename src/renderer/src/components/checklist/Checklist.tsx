import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ShieldCheck, Star, Users } from 'lucide-react'
import { getJobApplication } from '@api/jobs'
import { useSelectedKeywords } from '@hooks/useSelectedKeywords'
import { ChecklistSection } from '@checklist/ChecklistSection'
import { Button } from '@ui/Button'
import { Tooltip } from '@ui/Tooltip'
import type { Checklist } from '@type/checklist'
import type { LucideIcon } from 'lucide-react'

interface ChecklistProps {
  jobId: string | undefined
}

const tabs: Array<{ key: TabType; label: string; icon: LucideIcon }> = [
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
  checklist: Checklist
  activeTab: TabType
}

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
        const Icon = tab.icon
        return (
          <Tooltip key={tab.key} content={tab.label}>
            <Button
              variant="icon"
              active={activeTab === tab.key}
              onClick={() => onChange(tab.key)}
            >
              <Icon size={16} />
            </Button>
          </Tooltip>
        )
      })}
    </div>
  )
}

function ChecklistContent({ checklist, activeTab }: ChecklistContentProps) {
  const { selectedKeywords, toggleKeyword } = useSelectedKeywords(
    checklist.needTailoring,
  )

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
        onToggleKeyword={toggleKeyword}
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
  const { data: jobApplication } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: () => getJobApplication(jobId!),
    enabled: !!jobId,
  })

  const checklist = jobApplication?.checklist

  const [activeTab, setActiveTab] = useState<TabType>('hard')

  return (
    <div className="flex h-full flex-col">
      {checklist ? (
        <>
          <ChecklistTabs
            checklist={checklist}
            activeTab={activeTab}
            onChange={setActiveTab}
          />
          <ChecklistContent checklist={checklist} activeTab={activeTab} />
        </>
      ) : (
        <ChecklistLoadingState />
      )}
    </div>
  )
}

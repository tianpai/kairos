import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getJobApplication } from '@api/jobs'
import { ChecklistSection } from '@checklist/ChecklistSection'

interface ChecklistProps {
  jobId: string | undefined
}

type TabType = 'hard' | 'soft' | 'preferred'

export default function Checklist({ jobId }: ChecklistProps) {
  const { data: jobApplication } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: () => getJobApplication(jobId!),
    enabled: !!jobId,
  })

  const checklist = jobApplication?.checklist

  const [activeTab, setActiveTab] = useState<TabType>('hard')

  // Track selected keywords for needTailoring
  const [selectedKeywords, setSelectedKeywords] = useState<Set<string>>(
    new Set(),
  )

  // Initialize from checklist.needTailoring when checklist loads
  useEffect(() => {
    if (checklist?.needTailoring) {
      setSelectedKeywords(new Set(checklist.needTailoring))
    }
  }, [checklist?.needTailoring])

  // Toggle keyword selection (only for unfulfilled keywords)
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

  const selectedKeywordsArray = Array.from(selectedKeywords)

  const tabs: Array<{ key: TabType; label: string }> = [
    { key: 'hard', label: 'Hard Requirements' },
    { key: 'soft', label: 'Soft Requirements' },
    { key: 'preferred', label: 'Preferred Skills' },
  ]

  return (
    <div className="flex h-full flex-col">
      {checklist ? (
        <>
          {/* Vertical Tab Navigation */}
          <div className="bg-app-header m-2 flex flex-col rounded-lg p-2">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`w-full cursor-pointer rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                  activeTab === tab.key
                    ? 'bg-gray-200 font-medium text-gray-900 dark:bg-gray-700 dark:text-gray-100'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Active Section Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeTab === 'hard' && (
              <ChecklistSection
                requirements={checklist.hardRequirements}
                selectedKeywords={selectedKeywordsArray}
                onToggleKeyword={toggleKeyword}
              />
            )}
            {activeTab === 'soft' && (
              <ChecklistSection
                requirements={checklist.softRequirements}
                selectedKeywords={selectedKeywordsArray}
                onToggleKeyword={toggleKeyword}
              />
            )}
            {activeTab === 'preferred' && (
              <ChecklistSection
                requirements={checklist.preferredSkills}
                selectedKeywords={selectedKeywordsArray}
                onToggleKeyword={toggleKeyword}
              />
            )}
          </div>
        </>
      ) : (
        <p className="p-4 text-sm text-gray-500">No checklist data available</p>
      )}
    </div>
  )
}

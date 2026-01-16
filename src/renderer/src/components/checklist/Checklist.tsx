import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListTodo, ShieldCheck, SquarePen, Star, Users } from 'lucide-react'
import { getJobApplication, updateJobDescription } from '@api/jobs'
import { ChecklistSection } from '@checklist/ChecklistSection'
import { Button } from '@ui/Button'
import { Tooltip } from '@ui/Tooltip'
import { useResumeStore } from '@typst-compiler/resumeState'
import {
  CHECKLIST_PARSING,
  startWorkflow,
  useWorkflowStore,
} from '../../workflow'
import type { LucideIcon } from 'lucide-react'

interface ChecklistProps {
  jobId: string | undefined
}

type TabType = 'hard' | 'soft' | 'preferred'

export default function Checklist({ jobId }: ChecklistProps) {
  const queryClient = useQueryClient()

  const { data: jobApplication } = useQuery({
    queryKey: ['jobApplication', jobId],
    queryFn: () => getJobApplication(jobId!),
    enabled: !!jobId,
  })

  // Get resume data from store for workflow
  const resumeStructure = useResumeStore((state) => state.data)
  const templateId = useResumeStore((state) => state.templateId)

  // Check if checklist parsing is running
  const isParsingChecklist = useWorkflowStore((state) =>
    jobId ? state.isTaskRunning(jobId, CHECKLIST_PARSING) : false,
  )

  const checklist = jobApplication?.checklist
  const hasJobDescription = Boolean(jobApplication?.jobDescription?.trim())

  const [activeTab, setActiveTab] = useState<TabType>('hard')
  const [jdInput, setJdInput] = useState('')
  const [isEditingJd, setIsEditingJd] = useState(false)

  const updateJdMutation = useMutation({
    mutationFn: (jd: string) => updateJobDescription(jobId!, jd),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobApplication', jobId] })
      setJdInput('')
      setIsEditingJd(false)
    },
  })

  const handleEditJd = () => {
    setJdInput(jobApplication?.jobDescription || '')
    setIsEditingJd(true)
  }

  const handleCancelEdit = () => {
    setJdInput('')
    setIsEditingJd(false)
  }

  const handleParseChecklist = () => {
    if (!jobId || !jobApplication?.jobDescription) return

    startWorkflow('checklist-only', jobId, {
      jobDescription: jobApplication.jobDescription,
      resumeStructure,
      templateId,
    })
  }

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

  const tabs: Array<{ key: TabType; label: string; icon: LucideIcon }> = [
    { key: 'hard', label: 'Must Have', icon: ShieldCheck },
    { key: 'soft', label: 'Soft Skills', icon: Users },
    { key: 'preferred', label: 'Preferred', icon: Star },
  ]

  // Show JD input form when no job description exists
  if (!hasJobDescription) {
    return (
      <div className="flex h-full flex-col p-4">
        <h3 className="text-primary text-sm font-medium">
          Add Job Description
        </h3>
        <p className="text-hint mt-1 text-xs">
          Paste the job description to enable AI-powered tailoring and generate
          a requirements checklist.
        </p>
        <textarea
          value={jdInput}
          onChange={(e) => setJdInput(e.target.value)}
          placeholder="Paste the job description here..."
          className="border-default text-primary focus:border-primary placeholder:text-hint mt-3 flex-1 resize-none rounded-lg border bg-transparent p-3 text-sm leading-relaxed outline-none"
        />
        <div className="mt-3">
          <Button
            onClick={() => updateJdMutation.mutate(jdInput.trim())}
            disabled={!jdInput.trim() || updateJdMutation.isPending}
            loading={updateJdMutation.isPending}
          >
            Save Job Description
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {checklist ? (
        <>
          {/* Tab Navigation */}
          <div className="bg-app-header my-2 mr-2 ml-1 flex flex-wrap justify-center gap-1 rounded-lg p-2">
            {tabs.map((tab) => {
              const Icon = tab.icon
              return (
                <Tooltip key={tab.key} content={tab.label}>
                  <Button
                    variant="icon"
                    active={activeTab === tab.key}
                    onClick={() => setActiveTab(tab.key)}
                  >
                    <Icon size={16} />
                  </Button>
                </Tooltip>
              )
            })}
          </div>

          {/* Active Section Content */}
          <div className="flex-1 overflow-y-auto py-4 pr-4 pl-1">
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
        <div className="flex h-full flex-col p-4">
          <p className="text-hint text-sm">
            Checklist will appear here once job description is processed.
          </p>
          <div className="mt-4 flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <h4 className="text-hint text-xs font-medium">Job Description</h4>
              {!isEditingJd && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleEditJd}
                    className="text-hint hover:bg-hover hover:text-secondary rounded p-1"
                    title="Edit job description"
                  >
                    <SquarePen size={14} />
                  </button>
                  <button
                    onClick={handleParseChecklist}
                    disabled={isParsingChecklist}
                    className="text-hint hover:bg-hover hover:text-secondary rounded p-1 disabled:cursor-not-allowed disabled:opacity-50"
                    title="Parse into checklist"
                  >
                    <ListTodo size={14} />
                  </button>
                </div>
              )}
            </div>
            {isEditingJd ? (
              <div className="mt-2 flex flex-1 flex-col">
                <textarea
                  value={jdInput}
                  onChange={(e) => setJdInput(e.target.value)}
                  className="border-default text-primary focus:border-primary placeholder:text-hint flex-1 resize-none rounded-lg border bg-transparent p-3 text-sm leading-relaxed outline-none"
                />
                <div className="mt-3 flex gap-2">
                  <Button
                    onClick={handleCancelEdit}
                    disabled={updateJdMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={() => updateJdMutation.mutate(jdInput.trim())}
                    disabled={!jdInput.trim() || updateJdMutation.isPending}
                    loading={updateJdMutation.isPending}
                  >
                    Save
                  </Button>
                </div>
              </div>
            ) : (
              <div className="bg-hover text-secondary mt-2 flex-1 overflow-y-auto rounded-lg p-3 text-sm whitespace-pre-wrap">
                {jobApplication?.jobDescription}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

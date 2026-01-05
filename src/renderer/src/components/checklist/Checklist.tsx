import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ListTodo, SquarePen } from 'lucide-react'
import { getJobApplication, updateJobDescription } from '@api/jobs'
import { ChecklistSection } from '@checklist/ChecklistSection'
import { InvertedButton } from '@ui/InvertedButton'
import { useResumeStore } from '@typst-compiler/resumeState'
import {
  CHECKLIST_PARSING,
  startWorkflow,
  useWorkflowStore,
} from '../../workflow'

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

  const tabs: Array<{ key: TabType; label: string }> = [
    { key: 'hard', label: 'Hard Requirements' },
    { key: 'soft', label: 'Soft Requirements' },
    { key: 'preferred', label: 'Preferred Skills' },
  ]

  // Show JD input form when no job description exists
  if (!hasJobDescription) {
    return (
      <div className="flex h-full flex-col p-4">
        <h3 className="text-sm font-medium text-gray-900 dark:text-white">
          Add Job Description
        </h3>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          Paste the job description to enable AI-powered tailoring and generate
          a requirements checklist.
        </p>
        <textarea
          value={jdInput}
          onChange={(e) => setJdInput(e.target.value)}
          placeholder="Paste the job description here..."
          className="mt-3 flex-1 resize-none rounded-lg border border-gray-300 bg-transparent p-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-gray-500 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-400"
        />
        <div className="mt-3">
          <InvertedButton
            onClick={() => updateJdMutation.mutate(jdInput.trim())}
            disabled={!jdInput.trim() || updateJdMutation.isPending}
            loading={updateJdMutation.isPending}
          >
            Save Job Description
          </InvertedButton>
        </div>
      </div>
    )
  }

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
        <div className="flex h-full flex-col p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Checklist will appear here once job description is processed.
          </p>
          <div className="mt-4 flex flex-1 flex-col overflow-hidden">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-gray-500 dark:text-gray-400">
                Job Description
              </h4>
              {!isEditingJd && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleEditJd}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-300"
                    title="Edit job description"
                  >
                    <SquarePen size={14} />
                  </button>
                  <button
                    onClick={handleParseChecklist}
                    disabled={isParsingChecklist}
                    className="rounded p-1 text-gray-400 hover:bg-gray-200 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:hover:bg-gray-700 dark:hover:text-gray-300"
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
                  className="flex-1 resize-none rounded-lg border border-gray-300 bg-transparent p-3 text-sm leading-relaxed text-slate-800 outline-none focus:border-gray-500 dark:border-gray-600 dark:text-gray-200 dark:placeholder-gray-500 dark:focus:border-gray-400"
                />
                <div className="mt-3 flex gap-2">
                  <InvertedButton
                    onClick={handleCancelEdit}
                    disabled={updateJdMutation.isPending}
                  >
                    Cancel
                  </InvertedButton>
                  <InvertedButton
                    onClick={() => updateJdMutation.mutate(jdInput.trim())}
                    disabled={!jdInput.trim() || updateJdMutation.isPending}
                    loading={updateJdMutation.isPending}
                  >
                    Save
                  </InvertedButton>
                </div>
              </div>
            ) : (
              <div className="mt-2 flex-1 overflow-y-auto rounded-lg bg-gray-100 p-3 text-sm whitespace-pre-wrap text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {jobApplication?.jobDescription}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

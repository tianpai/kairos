import { create } from 'zustand'
import type {
  WorkflowBatchEntry,
  WorkflowCreateApplicationsPayload,
} from '@type/workflow-ipc'

export type ResumeSource = 'upload' | 'existing'
export type BatchStatus = 'idle' | 'processing' | 'completed' | 'failed'

export type JdEntry = WorkflowBatchEntry & {
  id: string
  jobUrl: string
}

export interface BatchProgress {
  status: BatchStatus
  current: number
  total: number
  errorMessage: string | null
}

type UploadSubmitPayload = Omit<
  Extract<WorkflowCreateApplicationsPayload, { resumeSource: 'upload' }>,
  'templateId'
>

type ExistingSubmitPayload = Extract<
  WorkflowCreateApplicationsPayload,
  { resumeSource: 'existing' }
>

export type SubmitPayload = UploadSubmitPayload | ExistingSubmitPayload

export const MAX_ENTRIES = 5

export function generateId(): string {
  return Math.random().toString(36).substring(2, 9)
}

export function normalizeUrl(url: string): string | undefined {
  const trimmed = url.trim()
  if (!trimmed) return undefined
  if (/^https?:\/\//i.test(trimmed)) return trimmed
  return `https://${trimmed}`
}

function createEmptyEntry(): JdEntry {
  return { id: generateId(), jobDescription: '', jobUrl: '' }
}

function getFilledEntries(entries: JdEntry[]): JdEntry[] {
  return entries.filter((e) => e.jobDescription.trim().length > 0)
}

interface NewApplicationState {
  isOpen: boolean
  resumeSource: ResumeSource
  rawResumeContent: string | null
  selectedSourceId: string | null
  entries: JdEntry[]
  isSubmitting: boolean
  batchProgress: BatchProgress
}

interface NewApplicationActions {
  // Modal
  openModal: () => void
  closeModal: () => void

  // Form inputs
  setResumeSource: (source: ResumeSource) => void
  setRawResumeContent: (content: string | null) => void
  setSelectedSourceId: (id: string | null) => void
  addEntry: () => void
  removeEntry: (id: string) => void
  updateEntry: (
    id: string,
    field: 'jobDescription' | 'jobUrl',
    value: string,
  ) => void

  // Submission
  setSubmitting: (isSubmitting: boolean) => void
  setBatchProgress: (update: Partial<BatchProgress>) => void
  reset: () => void

  // Selectors
  canSubmit: () => boolean
  buildPayload: () => SubmitPayload | null
}

type NewApplicationStore = NewApplicationState & NewApplicationActions

const initialState: NewApplicationState = {
  isOpen: false,
  resumeSource: 'upload',
  rawResumeContent: null,
  selectedSourceId: null,
  entries: [createEmptyEntry()],
  isSubmitting: false,
  batchProgress: { status: 'idle', current: 0, total: 0, errorMessage: null },
}

export const useNewApplicationStore = create<NewApplicationStore>()(
  (set, get) => ({
    ...initialState,

    openModal: () => set({ isOpen: true }),

    closeModal: () => {
      const { isSubmitting, batchProgress } = get()
      if (!isSubmitting && batchProgress.status !== 'processing') {
        set({ ...initialState, entries: [createEmptyEntry()] })
      }
    },

    setResumeSource: (source) =>
      set({
        resumeSource: source,
        rawResumeContent: null,
        selectedSourceId: null,
      }),

    setRawResumeContent: (content) => set({ rawResumeContent: content }),

    setSelectedSourceId: (id) => set({ selectedSourceId: id }),

    addEntry: () => {
      const { entries } = get()
      if (entries.length < MAX_ENTRIES) {
        set({ entries: [...entries, createEmptyEntry()] })
      }
    },

    removeEntry: (id) => {
      const { entries } = get()
      if (entries.length > 1) {
        set({ entries: entries.filter((e) => e.id !== id) })
      }
    },

    updateEntry: (id, field, value) =>
      set((s) => ({
        entries: s.entries.map((e) =>
          e.id === id ? { ...e, [field]: value } : e,
        ),
      })),

    setSubmitting: (isSubmitting) => set({ isSubmitting }),

    setBatchProgress: (update) =>
      set((s) => ({ batchProgress: { ...s.batchProgress, ...update } })),

    reset: () => set({ ...initialState, entries: [createEmptyEntry()] }),

    canSubmit: () => {
      const {
        resumeSource,
        rawResumeContent,
        selectedSourceId,
        entries,
        isSubmitting,
        batchProgress,
      } = get()

      if (isSubmitting || batchProgress.status === 'processing') return false

      const filledEntries = getFilledEntries(entries)
      if (resumeSource === 'upload' && !rawResumeContent?.trim()) return false
      if (resumeSource === 'existing' && !selectedSourceId) return false

      return filledEntries.length > 0
    },

    buildPayload: () => {
      const state = get()
      if (!state.canSubmit()) return null

      const { resumeSource, rawResumeContent, selectedSourceId, entries } =
        state
      const filledEntries = getFilledEntries(entries)
      const normalizedEntries = filledEntries.map((e) => ({
        jobDescription: e.jobDescription.trim(),
        jobUrl: normalizeUrl(e.jobUrl),
      }))

      if (resumeSource === 'upload') {
        const content = rawResumeContent?.trim()
        if (!content) return null
        return {
          resumeSource: 'upload',
          rawResumeContent: content,
          entries: normalizedEntries,
        }
      }

      if (!selectedSourceId) return null
      return {
        resumeSource: 'existing',
        sourceJobId: selectedSourceId,
        entries: normalizedEntries,
      }
    },
  }),
)

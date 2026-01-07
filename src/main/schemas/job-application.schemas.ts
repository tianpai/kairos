import { z } from 'zod'

// Create job application
export const CreateJobApplicationSchema = z.object({
  companyName: z.string().min(1),
  position: z.string().min(1),
  dueDate: z.string().date(),
  jobDescription: z.string().min(1),
  jobUrl: z.string().url().optional(),
  templateId: z.string().min(1),
  rawResumeContent: z.string().min(1),
})

// Create job application from scratch (no resume upload)
export const CreateFromScratchSchema = z.object({
  companyName: z.string().min(1),
  position: z.string().min(1),
  dueDate: z.string().date(),
  jobDescription: z.string().optional(),
  jobUrl: z.string().url().optional(),
  templateId: z.string().min(1),
})

// Create job application from existing (copy resume from another application)
export const CreateFromExistingSchema = z.object({
  sourceJobId: z.string().uuid(),
  companyName: z.string().min(1),
  position: z.string().min(1),
  dueDate: z.string().date(),
  jobDescription: z.string().min(1),
  jobUrl: z.string().url().optional(),
  templateId: z.string().min(1),
})

// Update job application (basic fields)
export const UpdateJobApplicationSchema = z.object({
  companyName: z.string().min(1).optional(),
  position: z.string().min(1).optional(),
  dueDate: z.string().date().optional(),
  jobUrl: z.string().url().nullable().optional(),
})

// Save resume
export const SaveResumeSchema = z.object({
  resumeStructure: z.record(z.string(), z.unknown()),
  templateId: z.string().min(1),
})

// Workflow data schemas
export const SaveParsedResumeSchema = z.object({
  parsedResume: z.record(z.string(), z.unknown()),
  tailoredResume: z.record(z.string(), z.unknown()),
})

export const SaveTailoredResumeSchema = z.object({
  tailoredResume: z.record(z.string(), z.unknown()),
})

export const SaveChecklistSchema = z.object({
  checklist: z.record(z.string(), z.unknown()),
})

export const SaveMatchScoreSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
})

export const SaveWorkflowStateSchema = z.object({
  workflowSteps: z.record(z.string(), z.unknown()).optional(),
  workflowStatus: z.string().optional(),
})

export const UpdateJobDescriptionSchema = z.object({
  jobDescription: z.string().min(1),
})

// Inferred types
export type CreateJobApplicationInput = z.infer<typeof CreateJobApplicationSchema>
export type CreateFromScratchInput = z.infer<typeof CreateFromScratchSchema>
export type CreateFromExistingInput = z.infer<typeof CreateFromExistingSchema>
export type UpdateJobApplicationInput = z.infer<typeof UpdateJobApplicationSchema>
export type UpdateJobDescriptionInput = z.infer<typeof UpdateJobDescriptionSchema>
export type SaveResumeInput = z.infer<typeof SaveResumeSchema>
export type SaveParsedResumeInput = z.infer<typeof SaveParsedResumeSchema>
export type SaveTailoredResumeInput = z.infer<typeof SaveTailoredResumeSchema>
export type SaveChecklistInput = z.infer<typeof SaveChecklistSchema>
export type SaveMatchScoreInput = z.infer<typeof SaveMatchScoreSchema>
export type SaveWorkflowStateInput = z.infer<typeof SaveWorkflowStateSchema>

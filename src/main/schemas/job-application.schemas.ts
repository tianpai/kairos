import { z } from "zod";
import { ChecklistSchema } from "@type/checklist";
import type {
  JobsCreateFromExistingPayload,
  JobsCreatePayload,
  JobsListQuery,
  JobsPatchPayload,
} from "@type/jobs-ipc";

// Create job application
export const CreateJobApplicationSchema: z.ZodType<JobsCreatePayload> =
  z.object({
    companyName: z.string().min(1),
    position: z.string().min(1),
    dueDate: z.string().date(),
    jobDescription: z.string().min(1),
    jobUrl: z.string().url().optional(),
    templateId: z.string().min(1),
    rawResumeContent: z.string().min(1),
  });

// Create job application from existing (copy resume from another application)
export const CreateFromExistingSchema: z.ZodType<JobsCreateFromExistingPayload> =
  z.object({
    sourceJobId: z.string().uuid(),
    companyName: z.string().min(1),
    position: z.string().min(1),
    dueDate: z.string().date(),
    jobDescription: z.string().min(1),
    jobUrl: z.string().url().optional(),
    templateId: z.string().min(1),
  });

// Save resume
export const SaveResumeSchema = z.object({
  resumeStructure: z.record(z.string(), z.unknown()),
  templateId: z.string().min(1),
});

// Workflow data schemas
export const SaveParsedResumeSchema = z.object({
  parsedResume: z.record(z.string(), z.unknown()),
  tailoredResume: z.record(z.string(), z.unknown()),
});

export const SaveTailoredResumeSchema = z.object({
  tailoredResume: z.record(z.string(), z.unknown()),
});

export const SaveChecklistSchema = z.object({
  checklist: ChecklistSchema,
});

export const SaveMatchScoreSchema = z.object({
  matchPercentage: z.number().min(0).max(100),
});

export const ListJobsSchema: z.ZodType<JobsListQuery> = z.object({
  archived: z.boolean().optional(),
});

export const PatchJobApplicationSchema: z.ZodType<JobsPatchPayload> = z
  .object({
    companyName: z.string().min(1).optional(),
    position: z.string().min(1).optional(),
    dueDate: z.string().date().optional(),
    jobUrl: z.string().url().nullable().optional(),
    jobDescription: z.string().min(1).optional(),
    pinned: z.boolean().optional(),
    archived: z.boolean().optional(),
    applicationStatus: z.string().nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: "At least one field is required",
  });

export const SaveWorkflowStateSchema = z.object({
  workflowSteps: z.record(z.string(), z.unknown()).optional(),
  workflowStatus: z.string().optional(),
});

// Inferred types
export type CreateJobApplicationInput = z.infer<
  typeof CreateJobApplicationSchema
>;
export type CreateFromExistingInput = z.infer<typeof CreateFromExistingSchema>;
export type SaveResumeInput = z.infer<typeof SaveResumeSchema>;
export type SaveParsedResumeInput = z.infer<typeof SaveParsedResumeSchema>;
export type SaveTailoredResumeInput = z.infer<typeof SaveTailoredResumeSchema>;
export type SaveChecklistInput = z.infer<typeof SaveChecklistSchema>;
export type SaveMatchScoreInput = z.infer<typeof SaveMatchScoreSchema>;
export type SaveWorkflowStateInput = z.infer<typeof SaveWorkflowStateSchema>;
export type ListJobsInput = z.infer<typeof ListJobsSchema>;
export type PatchJobApplicationInput = z.infer<
  typeof PatchJobApplicationSchema
>;

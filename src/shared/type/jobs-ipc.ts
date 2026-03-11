import { z } from "zod";
import type { Checklist } from "./checklist";
import type { WorkflowStatus, WorkflowStepsData } from "./workflow";

// TODO: inline this
export interface JobsCreateResult {
  id: string;
}

export interface JobSummary {
  id: string;
  companyName: string;
  position: string;
  dueDate: string;
  matchPercentage: number;
  applicationStatus: string | null;
  jobUrl: string | null;
  pinned: number;
  pinnedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication extends JobSummary {
  originalResume: string;
}

export interface FailedTaskInfo {
  status: "failed";
}

export type FailedTasksMap = Record<string, FailedTaskInfo>;

export interface JobApplicationDetails extends JobSummary {
  templateId: string;
  jobDescription: string | null;
  originalResume: string;
  parsedResume: Record<string, unknown> | null;
  tailoredResume: Record<string, unknown> | null;
  checklist: Checklist | null;
  workflowStatus: WorkflowStatus | null;
  workflowSteps: WorkflowStepsData | null;
  failedTasks: FailedTasksMap;
}

export interface JobsListQuery {
  archived?: boolean;
}

export interface JobsPatchPayload {
  companyName?: string;
  position?: string;
  dueDate?: string;
  jobUrl?: string | null;
  jobDescription?: string;
  pinned?: boolean;
  archived?: boolean;
  applicationStatus?: string | null;
}

// Create job application
export const CreateJobApplicationSchema = z.object({
  companyName: z.string().min(1),
  position: z.string().min(1),
  dueDate: z.string().date(),
  jobDescription: z.string().min(1),
  jobUrl: z.string().url().optional(),
  templateId: z.string().min(1),
  rawResumeContent: z.string().min(1),
});

// Create job application from existing (copy resume from another application)
export const CreateFromExistingSchema = z.object({
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

// Inferred types
export type CreateJobApplicationInput = z.infer<
  typeof CreateJobApplicationSchema
>;
export type CreateFromExistingInput = z.infer<typeof CreateFromExistingSchema>;
export type SaveResumeInput = z.infer<typeof SaveResumeSchema>;
export type ListJobsInput = z.infer<typeof ListJobsSchema>;
export type PatchJobApplicationInput = z.infer<
  typeof PatchJobApplicationSchema
>;

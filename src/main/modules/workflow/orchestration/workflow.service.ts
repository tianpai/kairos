import log from "electron-log/main";
import { RESUME_PARSING } from "@type/task-names";
import { AITaskClient } from "../../ai";
import { extractResumeTextFromFile } from "../resume-text-extractor";
import { WorkflowEngine } from "../engine/workflow-engine";
import { onWorkflowEvent } from "../events/workflow-events";
import { registerWorkflowTasks } from "../tasks";
import type { AiPreferencesStore } from "../../ai";
import type {
  WorkflowBatchEntry,
  WorkflowCreateApplicationsPayload,
  WorkflowCreateApplicationsResult,
  WorkflowStartTailoringPayload,
} from "@type/workflow-ipc";
import type { WorkflowStepsData } from "@type/workflow";
import type { TaskName, WorkflowContext } from "@type/task-contracts";
import type { Checklist } from "@type/checklist";
import type { WorkflowPersistencePort } from "../persistence/workflow.persistence";
import "../definitions/workflows";

const EXTRACTING_PLACEHOLDER = "Extracting...";

interface BatchSource {
  sourceJobId: string;
  templateId: string;
  parsedResume: Record<string, unknown>;
  entriesToClone: WorkflowBatchEntry[];
  initialCreatedIds: string[];
}

function getDefaultDueDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split("T")[0];
}

export class WorkflowService {
  private readonly engine: WorkflowEngine;
  private readonly aiClient: AITaskClient;

  constructor(
    private readonly workflowPersistence: WorkflowPersistencePort,
    aiPreferences: AiPreferencesStore,
  ) {
    this.aiClient = new AITaskClient(aiPreferences);
    registerWorkflowTasks({
      persistence: this.workflowPersistence,
      aiClient: this.aiClient,
    });
    this.engine = new WorkflowEngine(this.workflowPersistence);
  }

  startWorkflow(
    workflowName: string,
    jobId: string,
    initialContext: Partial<WorkflowContext>,
  ): Promise<void> {
    return this.engine.startWorkflow(workflowName, jobId, initialContext);
  }

  retryFailedTasks(jobId: string): Promise<TaskName[]> {
    return this.engine.retryFailedTasks(jobId);
  }

  async startTailoringFromJob(
    payload: WorkflowStartTailoringPayload,
  ): Promise<void> {
    const workflowState = await this.getWorkflowState(payload.jobId);
    if (workflowState?.status === "running") {
      throw new Error("A workflow is already running for this job");
    }

    const checklist = this.workflowPersistence.getChecklist(payload.jobId);
    const resume = this.workflowPersistence.getResume(payload.jobId);
    const resumeStructure = resume.tailoredResume ?? resume.parsedResume;
    const templateId = resume.templateId;

    if (!checklist) {
      throw new Error("Checklist is missing for this job");
    }

    if (!resumeStructure) {
      throw new Error("Resume content is missing for this job");
    }

    if (!templateId) {
      throw new Error("Template ID is missing for this job");
    }

    const checklistWithNeedTailoring: Checklist = {
      ...checklist,
      needTailoring: this.normalizeNeedTailoring(payload.needTailoring),
    };

    await this.startWorkflow("tailoring", payload.jobId, {
      checklist: checklistWithNeedTailoring,
      resumeStructure,
      templateId,
    });
  }

  async createApplications(
    payload: WorkflowCreateApplicationsPayload,
  ): Promise<WorkflowCreateApplicationsResult> {
    const total = payload.entries.length;
    if (total === 0) {
      return { createdIds: [], succeeded: 0, total: 0 };
    }

    const source =
      payload.resumeSource === "upload"
        ? await this.prepareUploadSource(payload)
        : await this.prepareExistingSource(payload);

    if (!source) {
      return { createdIds: [], succeeded: 0, total };
    }

    const clonedIds = await this.createFromSource(source);
    const createdIds = source.initialCreatedIds.concat(clonedIds);

    return {
      createdIds,
      succeeded: createdIds.length,
      total,
    };
  }

  async getWorkflowState(jobId: string): Promise<WorkflowStepsData | null> {
    const active = this.engine.getWorkflowSteps(jobId);
    if (active) return active;

    const row = this.workflowPersistence.getWorkflowRecord(jobId);
    if (!row) {
      throw new Error(`Job application with ID ${jobId} not found`);
    }

    const workflowSteps = row.workflowState as WorkflowStepsData | null;
    if (!workflowSteps) return null;

    const { recovered, wasStale } =
      this.engine.recoverStaleWorkflow(workflowSteps);

    if (wasStale) {
      this.workflowPersistence.saveWorkflowState(jobId, {
        workflowSteps: recovered,
        workflowStatus: recovered.status,
      });
    }

    return recovered;
  }

  private requireParsedResume(
    parsedResume: Record<string, unknown> | null,
    message: string,
  ): Record<string, unknown> {
    if (!parsedResume) {
      throw new Error(message);
    }

    return parsedResume;
  }

  private normalizeNeedTailoring(keywords: string[]): string[] {
    const seen = new Set<string>();
    const normalized: string[] = [];

    for (const rawKeyword of keywords) {
      const keyword = rawKeyword.trim();
      if (!keyword) continue;

      const dedupeKey = keyword.toLowerCase();
      if (seen.has(dedupeKey)) continue;

      seen.add(dedupeKey);
      normalized.push(keyword);
    }

    return normalized;
  }

  private async prepareUploadSource(
    payload: Extract<
      WorkflowCreateApplicationsPayload,
      { resumeSource: "upload" }
    >,
  ): Promise<BatchSource | null> {
    const [firstEntry, ...entriesToClone] = payload.entries;
    if (!firstEntry) {
      return null;
    }

    const rawResumeContent = await extractResumeTextFromFile(
      payload.resumeFile,
    );

    const firstResponse = this.workflowPersistence.createJobApplication({
      rawResumeContent,
      jobDescription: firstEntry.jobDescription,
      companyName: EXTRACTING_PLACEHOLDER,
      position: EXTRACTING_PLACEHOLDER,
      dueDate: getDefaultDueDate(),
      jobUrl: firstEntry.jobUrl,
      templateId: payload.templateId,
    });

    await this.startWorkflow("create-application", firstResponse.id, {
      rawResumeContent,
      jobDescription: firstEntry.jobDescription,
      templateId: payload.templateId,
    });

    await this.waitForTask(firstResponse.id, RESUME_PARSING);
    const firstResume = this.workflowPersistence.getResume(firstResponse.id);
    const parsedResume = this.requireParsedResume(
      firstResume.parsedResume,
      "Resume parsing failed",
    );

    return {
      sourceJobId: firstResponse.id,
      templateId: firstResume.templateId,
      parsedResume,
      entriesToClone,
      initialCreatedIds: [firstResponse.id],
    };
  }

  private async prepareExistingSource(
    payload: Extract<
      WorkflowCreateApplicationsPayload,
      { resumeSource: "existing" }
    >,
  ): Promise<BatchSource> {
    const sourceResume = this.workflowPersistence.getResume(
      payload.sourceJobId,
    );
    const parsedResume = this.requireParsedResume(
      sourceResume.parsedResume,
      "Source has no parsed resume",
    );

    return {
      sourceJobId: payload.sourceJobId,
      templateId: sourceResume.templateId,
      parsedResume,
      entriesToClone: payload.entries,
      initialCreatedIds: [],
    };
  }

  private async createFromSource(source: BatchSource): Promise<string[]> {
    const results = await Promise.all(
      source.entriesToClone.map((entry) =>
        this.createSingleFromSource(entry, source),
      ),
    );

    return results.filter((id): id is string => typeof id === "string");
  }

  private async createSingleFromSource(
    entry: WorkflowBatchEntry,
    source: BatchSource,
  ): Promise<string | null> {
    try {
      const response = this.workflowPersistence.createFromExisting({
        sourceJobId: source.sourceJobId,
        companyName: EXTRACTING_PLACEHOLDER,
        position: EXTRACTING_PLACEHOLDER,
        dueDate: getDefaultDueDate(),
        jobDescription: entry.jobDescription,
        jobUrl: entry.jobUrl,
        templateId: source.templateId,
      });

      void this.startWorkflow("checklist-only", response.id, {
        jobDescription: entry.jobDescription,
        resumeStructure: source.parsedResume,
        templateId: source.templateId,
      }).catch((error) => {
        log.error(`[Batch] Workflow failed for ${response.id}`, error);
      });

      return response.id;
    } catch (error) {
      log.error("[Batch] Failed to create application from source", error);
      return null;
    }
  }

  private async waitForTask(
    jobId: string,
    taskName: TaskName,
    timeoutMs = 120_000,
  ): Promise<void> {
    const taskStatus = this.engine.getWorkflow(jobId)?.taskStates[taskName];
    if (taskStatus === "completed") {
      return;
    }
    if (taskStatus === "failed") {
      throw new Error(`Task ${taskName} failed`);
    }

    await new Promise<void>((resolve, reject) => {
      let settled = false;
      let unsubscribePushState = () => {};

      const cleanup = () => {
        clearTimeout(timeoutId);
        unsubscribePushState();
      };

      const resolveOnce = () => {
        if (settled) return;
        settled = true;
        cleanup();
        resolve();
      };

      const rejectOnce = (error: Error) => {
        if (settled) return;
        settled = true;
        cleanup();
        reject(error);
      };

      const timeoutId = setTimeout(() => {
        rejectOnce(new Error(`Timed out waiting for task ${taskName}`));
      }, timeoutMs);

      unsubscribePushState = onWorkflowEvent(
        "workflow:pushState",
        (payload) => {
          if (payload.jobId !== jobId || payload.type === "stateChanged") {
            return;
          }

          if (
            payload.type === "taskCompleted" &&
            payload.taskName === taskName
          ) {
            resolveOnce();
            return;
          }

          if (payload.type === "taskFailed" && payload.taskName === taskName) {
            rejectOnce(new Error(payload.error || `Task ${taskName} failed`));
          }
        },
      );

      const currentStatus =
        this.engine.getWorkflow(jobId)?.taskStates[taskName];
      if (currentStatus === "completed") {
        resolveOnce();
      } else if (currentStatus === "failed") {
        rejectOnce(new Error(`Task ${taskName} failed`));
      }
    });
  }
}

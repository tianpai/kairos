import { randomUUID } from "node:crypto";
import { BrowserWindow } from "electron";
import log from "electron-log/main";
import { guardedHandle as handle } from "../runtime/ipc";
import {
  ChecklistRepository,
  JobRepository,
  ResumeRepository,
  ScoreRepository,
  WorkflowRepository,
  getDatabase,
  getSqlite,
} from "../persistence";
import { extractResumeTextFromFile } from "./resume-text-extractor";
import { onWorkflowEvent } from "./workflow-events";
import { getWfEngine } from "./index";

function broadcast<T>(channel: string, payload: T): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

interface JobCreatePayload {
  resumeSource: "upload" | "existing";
  resumeFile?: { fileName: string; data: ArrayBuffer };
  sourceJobId?: string;
  templateId: string;
  jobDescription: string;
  jobUrl?: string;
}

export function registerWfHandlers(): void {
  handle("job:create", async (_event, payload: JobCreatePayload) => {
    try {
      const db = getDatabase();
      const jobRepo = new JobRepository(db);
      const resumeRepo = new ResumeRepository(db);
      const checklistRepo = new ChecklistRepository(db);
      const scoreRepo = new ScoreRepository(db);
      const workflowRepo = new WorkflowRepository(db);

      // Resolve resume text
      let originalResume: string;
      let templateId: string;

      if (payload.resumeSource === "upload") {
        if (!payload.resumeFile) {
          throw new Error("Resume file required for upload");
        }
        originalResume = await extractResumeTextFromFile(payload.resumeFile);
        templateId = payload.templateId;
      } else {
        if (!payload.sourceJobId) {
          throw new Error("Source job ID required for existing resume");
        }
        const sourceResume = resumeRepo.findByJobId(payload.sourceJobId);
        if (!sourceResume) {
          throw new Error("Source resume not found");
        }
        originalResume = sourceResume.originalResume;
        templateId = sourceResume.templateId;
      }

      const jobId = randomUUID();
      const now = new Date().toISOString();

      const createRecords = getSqlite().transaction(() => {
        const assertCreated = (entityName: string, created: boolean): void => {
          if (!created) {
            throw new Error(`Failed to create ${entityName} for job ${jobId}`);
          }
        };

        assertCreated(
          "job",
          jobRepo.create({
            id: jobId,
            companyName: "Extracting...",
            position: "Extracting...",
            dueDate: now,
            status: "active",
            applicationStatus: null,
            jobUrl: payload.jobUrl ?? null,
            archived: 0,
            statusUpdatedAt: null,
            interviewDate: null,
            pinned: 0,
            pinnedAt: null,
            createdAt: now,
            updatedAt: now,
          }),
        );

        assertCreated(
          "resume",
          resumeRepo.create({
            jobId,
            templateId,
            originalResume,
            parsedResume: null,
            tailoredResume: null,
          }),
        );

        assertCreated(
          "checklist",
          checklistRepo.create({
            jobId,
            jobDescription: payload.jobDescription,
            checklist: null,
          }),
        );

        assertCreated("score", scoreRepo.create({ jobId, matchPercentage: 0 }));
        assertCreated("workflow", workflowRepo.create({ jobId, state: null }));
      });

      createRecords();

      return { jobId };
    } catch (error) {
      log.error("job:create failed", error);
      throw error;
    }
  });

  handle(
    "workflow:start",
    async (_event, jobId: string, workflowName: string) => {
      try {
        await getWfEngine().start(jobId, workflowName);
        return { success: true };
      } catch (error) {
        log.error("workflow:start failed", error);
        throw error;
      }
    },
  );

  handle("workflow:retry", async (_event, jobId: string) => {
    try {
      await getWfEngine().retry(jobId);
      return { success: true };
    } catch (error) {
      log.error("workflow:retry failed", error);
      throw error;
    }
  });

  handle("workflow:getState", (_event, jobId: string) => {
    try {
      return getWfEngine().getState(jobId);
    } catch (error) {
      log.error("workflow:getState failed", error);
      throw error;
    }
  });

  // Broadcast engine events to all renderer windows
  onWorkflowEvent("workflow:pushState", (payload) =>
    broadcast("workflow:pushState", payload),
  );
  onWorkflowEvent("workflow:aiPartial", (payload) =>
    broadcast("workflow:aiPartial", payload),
  );
}

import log from "electron-log/main";
import { z } from "zod";
import {
  ListJobsSchema,
  PatchJobApplicationSchema,
  SaveResumeSchema,
} from "@type/jobs-ipc";
import { getDatabase } from "../persistence";
import { guardedHandle as handle } from "../runtime/ipc";
import { JobNotFoundError, WorkspaceService } from "./workspace.service";

export function workspaceIPC(): void {
  const service = new WorkspaceService(getDatabase());
  jobIPC(service);
  resumeIPC(service);
  checklistIPC(service);
}

function jobIPC(service: WorkspaceService): void {
  handle("jobs:list", async (_, data: unknown) => {
    const validated = ListJobsSchema.parse(data ?? {});
    return service.listJobApplications(validated);
  });

  handle("jobs:get", async (_, id: string) => {
    try {
      return await service.getJobApplication(id);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found: ${id}`);
        throw new Error(error.message);
      }
      log.error("jobs:get failed", error);
      throw error;
    }
  });

  handle("jobs:patch", async (_, id: string, data: unknown) => {
    const validated = PatchJobApplicationSchema.parse(data);
    try {
      return await service.patchJobApplication(id, validated);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        throw new Error(error.message);
      }
      throw error;
    }
  });

  handle("jobs:delete", async (_, id: string) => {
    try {
      const result = await service.deleteJobApplication(id);
      log.info(`Job deleted: ${id}`);
      return result;
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for delete: ${id}`);
        throw new Error(error.message);
      }
      log.error("jobs:delete failed", error);
      throw error;
    }
  });

  handle("jobs:deleteAll", async () => {
    try {
      const result = service.deleteAllJobApplications();
      log.info("All job applications deleted");
      return result;
    } catch (error) {
      log.error("jobs:deleteAll failed", error);
      throw error;
    }
  });
}

function resumeIPC(service: WorkspaceService): void {
  handle("resume:get", async (_, id: string) => {
    try {
      return await service.getResume(id);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for resume:get: ${id}`);
        throw new Error(error.message);
      }
      log.error("resume:get failed", error);
      throw error;
    }
  });

  handle("resume:save", async (_, id: string, data: unknown) => {
    const validated = SaveResumeSchema.parse(data);
    return service.saveResume(id, validated);
  });

  handle("resume:getTemplateId", async (_, id: string) => {
    try {
      return await service.getTemplateId(id);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for resume:getTemplateId: ${id}`);
        throw new Error(error.message);
      }
      log.error("resume:getTemplateId failed", error);
      throw error;
    }
  });
}

// TODO: use type from shared/type instead of create new type from zod
const NeedTailoringSchema = z.array(z.string());

function checklistIPC(service: WorkspaceService): void {
  handle("checklist:get", async (_, id: string) => {
    try {
      return await service.getChecklist(id);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for checklist:get: ${id}`);
        throw new Error(error.message);
      }
      log.error("checklist:get failed", error);
      throw error;
    }
  });

  handle("checklist:getKw", async (_, id: string) => {
    try {
      return await service.getChecklistKw(id);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for checklist:getKw: ${id}`);
        throw new Error(error.message);
      }
      log.error("checklist:getKw failed", error);
      throw error;
    }
  });

  handle("checklist:updateKw", async (_, id: string, kw: unknown) => {
    const validated = NeedTailoringSchema.parse(kw);
    try {
      return await service.updateChecklistNeedTailoring(id, validated);
    } catch (error) {
      if (error instanceof JobNotFoundError) {
        log.warn(`Job not found for checklist:updateKw: ${id}`);
        throw new Error(error.message);
      }
      log.error("checklist:updateKw failed", error);
      throw error;
    }
  });
}

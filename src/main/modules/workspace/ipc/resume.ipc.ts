import log from "electron-log/main";
import { guardedHandle as handle } from "../../runtime/ipc";
import { SaveResumeSchema } from "../../../schemas/job-application.schemas";
import { JobNotFoundError } from "../application/workspace-application.service";
import type { WorkspaceApplicationService } from "../application/workspace-application.service";

export function resumeIPC(service: WorkspaceApplicationService): void {
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

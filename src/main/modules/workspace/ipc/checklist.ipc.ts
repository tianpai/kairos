import log from "electron-log/main";
import { z } from "zod";
import { guardedHandle as handle } from "../../runtime/ipc";
import { JobNotFoundError } from "../application/workspace-application.service";
import type { WorkspaceApplicationService } from "../application/workspace-application.service";

// TODO: use type from shared/type instead of create new type from zod
const NeedTailoringSchema = z.array(z.string());

export function checklistIPC(service: WorkspaceApplicationService): void {
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

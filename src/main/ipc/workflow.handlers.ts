import { BrowserWindow } from "electron";
import log from "electron-log/main";
import { onWorkflowEvent } from "../workflow/workflow-events";
import { guardedHandle as handle } from "./guarded-handler";
import type {
  WorkflowCreateApplicationsPayload,
  WorkflowGetStatePayload,
  WorkflowRetryPayload,
  WorkflowStartTailoringPayload,
} from "@type/workflow-ipc";
import type { WorkflowService } from "../workflow/workflow.service";

function broadcast<T>(channel: string, payload: T): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

export function registerWorkflowHandlers(
  workflowService: WorkflowService,
): void {
  handle("workflow:retry", async (_event, payload: WorkflowRetryPayload) => {
    try {
      const failedTasks = await workflowService.retryFailedTasks(payload.jobId);
      return { success: true, failedTasks };
    } catch (error) {
      log.error("workflow:retry failed", error);
      throw error;
    }
  });

  handle(
    "workflow:startTailoring",
    async (_event, payload: WorkflowStartTailoringPayload) => {
      try {
        await workflowService.startTailoringFromJob(payload);
        return { success: true };
      } catch (error) {
        log.error("workflow:startTailoring failed", error);
        throw error;
      }
    },
  );

  handle(
    "workflow:getState",
    async (_event, payload: WorkflowGetStatePayload) => {
      try {
        const workflow = await workflowService.getWorkflowState(payload.jobId);
        return { workflow };
      } catch (error) {
        log.error("workflow:getState failed", error);
        throw error;
      }
    },
  );

  handle(
    "workflow:createApplications",
    async (_event, payload: WorkflowCreateApplicationsPayload) => {
      try {
        return await workflowService.createApplications(payload);
      } catch (error) {
        log.error("workflow:createApplications failed", error);
        throw error;
      }
    },
  );

  onWorkflowEvent("workflow:pushState", (payload) =>
    broadcast("workflow:pushState", payload),
  );
  onWorkflowEvent("workflow:aiPartial", (payload) =>
    broadcast("workflow:aiPartial", payload),
  );
}

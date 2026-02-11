import { BrowserWindow } from "electron";
import log from "electron-log/main";
import { onWorkflowEvent } from "../workflow/workflow-events";
import { guardedHandle as handle } from "./guarded-handler";
import type {
  WorkflowGetStatePayload,
  WorkflowRetryPayload,
  WorkflowStartPayload,
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
  handle("workflow:start", async (_event, payload: WorkflowStartPayload) => {
    try {
      await workflowService.startWorkflow(
        payload.workflowName,
        payload.jobId,
        payload.initialContext,
      );
      return { success: true };
    } catch (error) {
      log.error("workflow:start failed", error);
      throw error;
    }
  });

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

  onWorkflowEvent("workflow:stateChanged", (payload) =>
    broadcast("workflow:stateChanged", payload),
  );
  onWorkflowEvent("workflow:taskCompleted", (payload) =>
    broadcast("workflow:taskCompleted", payload),
  );
  onWorkflowEvent("workflow:taskFailed", (payload) =>
    broadcast("workflow:taskFailed", payload),
  );
  onWorkflowEvent("workflow:completed", (payload) =>
    broadcast("workflow:completed", payload),
  );
  onWorkflowEvent("workflow:aiPartial", (payload) =>
    broadcast("workflow:aiPartial", payload),
  );
}

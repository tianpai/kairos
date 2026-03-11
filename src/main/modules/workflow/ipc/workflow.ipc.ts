import { BrowserWindow } from "electron";
import log from "electron-log/main";
import { onWorkflowEvent } from "../events/workflow-events";
import { guardedHandle as handle } from "../../runtime/ipc";
import type { WorkflowStartPayload } from "@type/workflow-ipc";
import type { WorkflowService } from "../orchestration/workflow.service";

function broadcast<T>(channel: string, payload: T): void {
  for (const window of BrowserWindow.getAllWindows()) {
    window.webContents.send(channel, payload);
  }
}

export function registerWorkflowHandlers(
  workflowService: WorkflowService,
): void {
  // TODO: inline payload to be be id and workflow name as two argument
  handle("workflow:start", async (_event, payload: WorkflowStartPayload) => {
    try {
      await workflowService.startWorkflow(payload.workflowName, payload.jobId);
      return { success: true };
    } catch (error) {
      log.error("workflow:start failed", error);
      throw error;
    }
  });

  // TODO: instead of payload, just use jobId: string no object
  handle("workflow:retry", async (_event, payload: { jobId: string }) => {
    try {
      const failedTasks = await workflowService.retryFailedTasks(payload.jobId);
      return { success: true, failedTasks };
    } catch (error) {
      log.error("workflow:retry failed", error);
      throw error;
    }
  });

  // TODO: instead of payload, just use jobId: string no object
  handle("workflow:getState", async (_event, payload: { jobId: string }) => {
    try {
      const workflow = await workflowService.getWorkflowState(payload.jobId);
      return { workflow };
    } catch (error) {
      log.error("workflow:getState failed", error);
      throw error;
    }
  });

  onWorkflowEvent("workflow:pushState", (payload) =>
    broadcast("workflow:pushState", payload),
  );
  onWorkflowEvent("workflow:aiPartial", (payload) =>
    broadcast("workflow:aiPartial", payload),
  );
}
